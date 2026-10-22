const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = __dirname, DATA = path.join(ROOT, 'data.json'), PUBLIC = path.join(ROOT, 'public');
const PORT = process.env.PORT || 3000;
const seed = {
  users: [
    {id:'u-patient',name:'Alex Morgan',email:'patient@demo.com',password:'Demo123!',role:'patient'},
    {id:'u-staff',name:'Jamie Lee',email:'staff@demo.com',password:'Demo123!',role:'staff'},
    {id:'u-dentist',name:'Dr. Maya Chen',email:'dentist@demo.com',password:'Demo123!',role:'dentist'},
    {id:'u-it',name:'IT Administrator',email:'it@demo.com',password:'Demo123!',role:'it'}
  ],
  procedures: [
    {id:'cleaning',name:'Professional Cleaning',category:'Preventive care',description:'A gentle clean to help keep your smile healthy.',price:850,duration:30,color:'mint'},
    {id:'checkup',name:'Dental Check-up',category:'Consultation',description:'A comprehensive dental examination and advice.',price:500,duration:20,color:'blue'},
    {id:'whitening',name:'Teeth Whitening',category:'Cosmetic dentistry',description:'A brighter smile with a guided whitening session.',price:2200,duration:60,color:'peach'},
    {id:'extraction',name:'Tooth Extraction',category:'Oral surgery',description:'Assessment and extraction appointment with a dentist.',price:1500,duration:45,color:'lilac'},
    {id:'filling',name:'Dental Filling',category:'Restorative care',description:'Restore a tooth with a comfortable filling appointment.',price:1200,duration:40,color:'blue'}
  ],
  dentists: [
    {id:'d-maya',name:'Dr. Maya Chen',specialty:'General Dentistry',initials:'MC',color:'mint'},
    {id:'d-noah',name:'Dr. Noah Patel',specialty:'Cosmetic Dentistry',initials:'NP',color:'peach'},
    {id:'d-sophia',name:'Dr. Sophia Kim',specialty:'Restorative Dentistry',initials:'SK',color:'lilac'}
  ],
  appointments: [
    {id:'APT-2048',patientId:'u-patient',patientName:'Alex Morgan',email:'patient@demo.com',phone:'081 234 5678',procedureId:'cleaning',procedureName:'Professional Cleaning',dentistId:'d-maya',dentistName:'Dr. Maya Chen',date:nextDate(1),time:'10:00',status:'Confirmed',paymentStatus:'Unpaid',notes:'',createdAt:new Date().toISOString()},
    {id:'APT-2049',patientId:'u-patient',patientName:'Alex Morgan',email:'patient@demo.com',phone:'081 234 5678',procedureId:'checkup',procedureName:'Dental Check-up',dentistId:'d-noah',dentistName:'Dr. Noah Patel',date:nextDate(4),time:'14:00',status:'Pending',paymentStatus:'Unpaid',notes:'',createdAt:new Date().toISOString()}
  ],
  logs: [{id:'LOG-001',level:'INFO',message:'System initialized successfully',at:new Date().toISOString(),actor:'System'}],
  settings:{clinicName:'Lumina Dental Studio',maintenanceMode:false,lastBackup:null}
};
function nextDate(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function read(){try{return JSON.parse(fs.readFileSync(DATA,'utf8'))}catch{fs.writeFileSync(DATA,JSON.stringify(seed,null,2));return JSON.parse(JSON.stringify(seed))}}
function save(db){fs.writeFileSync(DATA,JSON.stringify(db,null,2))}
let db=read(), sessions=new Map();
function log(message,actor='System',level='INFO'){db.logs.unshift({id:'LOG-'+Date.now(),level,message,actor,at:new Date().toISOString()});db.logs=db.logs.slice(0,200);save(db)}
function send(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS',...headers});res.end(JSON.stringify(data))}
function cookieToken(req){const m=(req.headers.cookie||'').match(/dental_session=([^;]+)/);return m&&m[1]}
function currentUser(req){return sessions.get(cookieToken(req))}
function body(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(Error('Invalid JSON'))}})})}
function publicUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role}}
function routeApi(req,res,url){
  (async()=>{
    if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
    if(url.pathname==='/api/health')return send(res,200,{ok:true,clinic:db.settings.clinicName})
    if(url.pathname==='/api/login'&&req.method==='POST'){
      const b=await body(req),u=db.users.find(x=>x.email.toLowerCase()===String(b.email||'').toLowerCase()&&x.password===b.password);
      if(!u){log('Failed login attempt for '+String(b.email||'unknown'),'Security','WARN');return send(res,401,{error:'Email or password is incorrect.'})}
      const token=crypto.randomBytes(24).toString('hex');sessions.set(token,publicUser(u));log('User signed in',u.name);
      return send(res,200,{user:publicUser(u)},{'Set-Cookie':`dental_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`})
    }
    if(url.pathname==='/api/logout'&&req.method==='POST'){sessions.delete(cookieToken(req));return send(res,200,{ok:true},{'Set-Cookie':'dental_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'})}
    if(url.pathname==='/api/me'){const u=currentUser(req);return send(res,200,{user:u||null})}
    if(url.pathname==='/api/procedures')return send(res,200,{procedures:db.procedures,dentists:db.dentists})
    const u=currentUser(req),adminPath=url.pathname.startsWith('/api/admin');
    if(!u)return send(res,401,{error:'Please sign in to continue.'});
    const isStaff=['staff','it'].includes(u.role),isDentist=['dentist','it'].includes(u.role),isIT=u.role==='it';
    if(url.pathname==='/api/appointments'&&req.method==='GET'){
      let list=db.appointments;
      if(u.role==='patient')list=list.filter(a=>a.patientId===u.id);
      if(u.role==='dentist')list=list.filter(a=>a.dentistName===u.name);
      return send(res,200,{appointments:list})
    }
    if(url.pathname==='/api/appointments'&&req.method==='POST'){
      const b=await body(req),proc=db.procedures.find(p=>p.id===b.procedureId),dent=db.dentists.find(d=>d.id===b.dentistId);
      if(!proc||!dent||!b.date||!b.time||!b.patientName||!b.email||!b.phone)return send(res,400,{error:'Please complete all required booking details.'});
      if(b.date<new Date().toISOString().slice(0,10))return send(res,400,{error:'Please choose a future date.'});
      if(!/^([01]\d|2[0-3]):(00|30)$/.test(b.time))return send(res,400,{error:'Choose a valid 30-minute time slot.'});
      if(db.appointments.some(a=>a.dentistId===dent.id&&a.date===b.date&&a.time===b.time&&a.status!=='Cancelled'))return send(res,409,{error:'That slot has just been booked. Please choose another time.'});
      const ap={id:'APT-'+String(Date.now()).slice(-7),patientId:u.id,patientName:b.patientName,email:b.email,phone:b.phone,procedureId:proc.id,procedureName:proc.name,dentistId:dent.id,dentistName:dent.name,date:b.date,time:b.time,status:'Pending',paymentStatus:'Unpaid',notes:String(b.notes||'').slice(0,300),createdAt:new Date().toISOString()};
      db.appointments.unshift(ap);log('Appointment '+ap.id+' created',u.name);save(db);return send(res,201,{appointment:ap})
    }
    const am=url.pathname.match(/^\/api\/appointments\/([^/]+)$/);
    if(am&&req.method==='PATCH'){
      const b=await body(req),ap=db.appointments.find(a=>a.id===am[1]);if(!ap)return send(res,404,{error:'Appointment not found.'});
      if(u.role==='patient'&&ap.patientId!==u.id)return send(res,403,{error:'Not authorized.'});
      if(u.role==='patient'){
        if(b.action==='cancel'){const cutoff=new Date(ap.date+'T'+ap.time+':00');if(cutoff-Date.now()<24*60*60*1000)return send(res,400,{error:'Appointments can only be cancelled or rescheduled at least 24 hours ahead.'});ap.status='Cancelled'}
        else if(b.action==='reschedule'){if(new Date(ap.date+'T'+ap.time)-Date.now()<24*60*60*1000)return send(res,400,{error:'Appointments can only be rescheduled at least 24 hours ahead.'});if(!b.date||!b.time)return send(res,400,{error:'Choose a new date and time.'});if(db.appointments.some(a=>a.id!==ap.id&&a.dentistId===ap.dentistId&&a.date===b.date&&a.time===b.time&&a.status!=='Cancelled'))return send(res,409,{error:'That slot is no longer available.'});ap.date=b.date;ap.time=b.time;ap.status='Pending'}
        else return send(res,403,{error:'Unsupported action.'});
      }else if(isStaff||isDentist){
        if(b.status&&['Pending','Confirmed','Completed','Cancelled'].includes(b.status))ap.status=b.status;
        if(b.paymentStatus&&['Unpaid','Paid'].includes(b.paymentStatus))ap.paymentStatus=b.paymentStatus;
      }else return send(res,403,{error:'Not authorized.'});
      log('Appointment '+ap.id+' updated',u.name);save(db);return send(res,200,{appointment:ap})
    }
    if(url.pathname==='/api/payments/demo'&&req.method==='POST'){
      const b=await body(req),ap=db.appointments.find(a=>a.id===b.appointmentId&&a.patientId===u.id);
      if(!ap)return send(res,404,{error:'Appointment not found.'});
      ap.paymentStatus='Paid';ap.paymentReference='DEMO-'+Date.now();log('Demo payment recorded for '+ap.id,u.name,'INFO');save(db);
      return send(res,200,{message:'Demo payment successful. No real money was charged.',appointment:ap})
    }
    if(url.pathname==='/api/admin/overview'){
      if(!isStaff&&!isIT)return send(res,403,{error:'Staff access required.'});
      return send(res,200,{appointments:db.appointments,users:db.users.map(publicUser),procedures:db.procedures,dentists:db.dentists,settings:db.settings,logs:isIT?db.logs.slice(0,50):[]})
    }
    if(url.pathname==='/api/admin/users'&&req.method==='POST'){
      if(!isIT)return send(res,403,{error:'IT administrator access required.'});
      const b=await body(req);if(!b.name||!b.email||!b.password||!['patient','staff','dentist','it'].includes(b.role))return send(res,400,{error:'Complete all account fields.'});
      if(db.users.some(x=>x.email.toLowerCase()===b.email.toLowerCase()))return send(res,409,{error:'Email already exists.'});
      const nu={id:'u-'+Date.now(),name:b.name,email:b.email,password:b.password,role:b.role};db.users.push(nu);log('Account created: '+nu.email,u.name);save(db);return send(res,201,{user:publicUser(nu)})
    }
    if(url.pathname==='/api/admin/backup'&&req.method==='POST'){
      if(!isIT)return send(res,403,{error:'IT administrator access required.'});
      const backupPath=path.join(ROOT,'backups');fs.mkdirSync(backupPath,{recursive:true});const name='backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';fs.writeFileSync(path.join(backupPath,name),JSON.stringify(db,null,2));db.settings.lastBackup=new Date().toISOString();log('Data backup created: '+name,u.name);save(db);return send(res,200,{message:'Backup created.',file:name,lastBackup:db.settings.lastBackup})
    }
    if(url.pathname==='/api/admin/settings'&&req.method==='PATCH'){
      if(!isIT)return send(res,403,{error:'IT administrator access required.'});
      const b=await body(req);if(typeof b.maintenanceMode==='boolean')db.settings.maintenanceMode=b.maintenanceMode;log('System settings updated',u.name,'WARN');save(db);return send(res,200,{settings:db.settings})
    }
    return send(res,404,{error:'API route not found.'})
  })().catch(e=>send(res,500,{error:'Server error',detail:process.env.NODE_ENV==='development'?e.message:undefined}))
}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/'))return routeApi(req,res,url);
  let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';
  const target=path.normalize(path.join(PUBLIC,pathname));
  if(!target.startsWith(PUBLIC))return send(res,403,{error:'Forbidden'});
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Page not found.');}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(data)})
}).listen(PORT,()=>console.log(`Lumina Dental running at http://localhost:${PORT}`));
