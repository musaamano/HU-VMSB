import { useState, useEffect } from "react";
import "./adminTheme.css";

const BASE = "/api";
const authReq = async (url, opts = {}) => {
  const token = localStorage.getItem("authToken");
  const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...opts.headers } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || "HTTP " + res.status);
  return data;
};

const RC = { ADMIN:"#6366f1",TRANSPORT:"#3b82f6",DRIVER:"#22c55e",USER:"#f59e0b",FUEL_OFFICER:"#f97316",GATE_OFFICER:"#8b5cf6",MAINTENANCE:"#14b8a6" };
const RL = { ADMIN:"Admin",TRANSPORT:"Transport Officer",DRIVER:"Driver",USER:"Staff/User",FUEL_OFFICER:"Fuel Officer",GATE_OFFICER:"Gate Officer",MAINTENANCE:"Maintenance" };
const TC = { pending:"#f59e0b",assigned:"#6366f1",accepted:"#3b82f6",started:"#22c55e",completed:"#94a3b8",rejected:"#ef4444",cancelled:"#ef4444" };
const IC = { reported:"#ef4444",acknowledged:"#3b82f6",in_repair:"#f59e0b",resolved:"#22c55e" };
const FC = { Pending:"#f59e0b",Approved:"#22c55e",Rejected:"#ef4444",Dispensed:"#6366f1" };

const Badge = ({ v, map }) => (
  <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
    background:(map[v]||"#94a3b8")+"22", color:map[v]||"#94a3b8" }}>{v}</span>
);

export default function AdminControlCenter() {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [issues, setIssues] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [bc, setBc] = useState({ title:"", message:"", roles:[] });
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState(null);

  const msg = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const [u,t,i,f] = await Promise.all([
        authReq(BASE+"/admin/users").catch(()=>[]),
        authReq(BASE+"/transport/requests").catch(()=>[]),
        authReq(BASE+"/admin/maintenance/issues").catch(()=>[]),
        authReq(BASE+"/admin/fuel-requests").catch(()=>[]),
      ]);
      setUsers(Array.isArray(u)?u:[]);
      setTrips(Array.isArray(t)?t:[]);
      setIssues(Array.isArray(i)?i:[]);
      setFuel(Array.isArray(f)?f:[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleUser = async (u) => {
    try {
      await authReq(BASE+"/admin/users/"+u._id, { method:"PUT", body:JSON.stringify({ isActive:!u.isActive }) });
      setUsers(p => p.map(x => x._id===u._id ? {...x, isActive:!x.isActive} : x));
      msg(u.name + (u.isActive ? " deactivated." : " activated."));
    } catch(e) { msg("Error: "+e.message); }
  };

  const resetPw = async () => {
    if (!modal?.pw || modal.pw.length < 6) { msg("Password must be 6+ chars"); return; }
    try {
      await authReq(BASE+"/admin/users/"+modal.user._id+"/reset-password", { method:"PUT", body:JSON.stringify({ newPassword:modal.pw }) });
      msg("Password reset for "+modal.user.name);
      setModal(null);
    } catch(e) { msg("Error: "+e.message); }
  };

  const cancelTrip = async (trip) => {
    const reason = prompt("Reason for cancellation:");
    if (!reason) return;
    try {
      await authReq(BASE+"/admin/trips/"+trip._id+"/cancel", { method:"PUT", body:JSON.stringify({ reason }) });
      msg("Trip cancelled.");
      load();
    } catch(e) { msg("Error: "+e.message); }
  };

  const resolveIssue = async (issue) => {
    const notes = prompt("Resolution notes:");
    if (!notes) return;
    try {
      await authReq(BASE+"/admin/maintenance/issues/"+issue._id, { method:"PUT", body:JSON.stringify({ status:"resolved", resolutionNotes:notes }) });
      msg("Issue resolved.");
      load();
    } catch(e) { msg("Error: "+e.message); }
  };

  const approveFuel = async (id) => {
    try {
      await authReq(BASE+"/admin/fuel-requests/"+id+"/approve", { method:"PUT" });
      msg("Fuel request approved.");
      load();
    } catch(e) { msg("Error: "+e.message); }
  };

  const sendBc = async () => {
    if (!bc.title||!bc.message||!bc.roles.length) { msg("Fill title, message and select roles."); return; }
    setSending(true);
    try {
      const r = await authReq(BASE+"/admin/broadcast", { method:"POST", body:JSON.stringify(bc) });
      msg("Broadcast sent to "+r.notified+" user(s).");
      setBc({ title:"", message:"", roles:[] });
    } catch(e) { msg("Error: "+e.message); }
    finally { setSending(false); }
  };

  const rc = {};
  users.forEach(u => { rc[u.role]=(rc[u.role]||0)+1; });
  const active = trips.filter(t=>["assigned","accepted","started"].includes(t.status));
  const pending = trips.filter(t=>t.status==="pending");
  const open = issues.filter(i=>i.status!=="resolved");
  const pf = fuel.filter(f=>f.status==="Pending");

  const TABS = ["overview","users","trips","maintenance","fuel","broadcast"];

  const TH = ({c}) => <th style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",borderBottom:"2px solid #e5e7eb",whiteSpace:"nowrap"}}>{c}</th>;
  const TD = ({c,s}) => <td style={{padding:"10px 14px",...s}}>{c}</td>;

  return (
    <div style={{padding:"24px 28px",maxWidth:1200}}>
      {toast && <div style={{position:"fixed",top:20,right:20,background:"#1e293b",color:"#fff",padding:"12px 20px",borderRadius:10,zIndex:9999,fontSize:14,fontWeight:600}}>{toast}</div>}

      {modal?.type==="resetpw" && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:360,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
            <h3 style={{margin:"0 0 16px"}}>Reset Password — {modal.user.name}</h3>
            <input type="password" placeholder="New password (min 6 chars)" value={modal.pw||""} onChange={e=>setModal(m=>({...m,pw:e.target.value}))}
              style={{width:"100%",padding:"10px 14px",border:"2px solid #e5e7eb",borderRadius:10,fontSize:14,boxSizing:"border-box",marginBottom:16}} />
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #e5e7eb",background:"#f8fafc",cursor:"pointer",fontWeight:600}}>Cancel</button>
              <button onClick={resetPw} style={{flex:1,padding:10,borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontWeight:700}}>Reset</button>
            </div>
          </div>
        </div>
      )}

      <div style={{marginBottom:24}}>
        <h1 style={{margin:"0 0 4px",fontSize:22,fontWeight:700,color:"#1e293b"}}>Admin Control Center</h1>
        <p style={{margin:0,color:"#64748b",fontSize:14}}>Full oversight and control over all roles and system activity</p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 18px",borderRadius:20,border:"2px solid",fontWeight:700,fontSize:13,cursor:"pointer",
            borderColor:tab===t?"#6366f1":"#e5e7eb",background:tab===t?"linear-gradient(135deg,#6366f1,#4f46e5)":"#fff",color:tab===t?"#fff":"#374151",textTransform:"capitalize"}}>
            {t}
          </button>
        ))}
        <button onClick={load} style={{marginLeft:"auto",padding:"8px 14px",borderRadius:20,border:"1px solid #e5e7eb",background:"#f8fafc",color:"#6366f1",fontWeight:600,fontSize:13,cursor:"pointer"}}>↻ Refresh</button>
      </div>

      {loading ? <p style={{color:"#94a3b8",textAlign:"center",padding:"3rem"}}>Loading...</p> : (
        <>
          {tab==="overview" && (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
                {[{icon:"👥",label:"Total Users",value:users.length,color:"#6366f1",go:"users"},
                  {icon:"🚗",label:"Active Trips",value:active.length,color:"#22c55e",go:"trips"},
                  {icon:"🔧",label:"Open Issues",value:open.length,color:"#ef4444",go:"maintenance"},
                  {icon:"⛽",label:"Pending Fuel",value:pf.length,color:"#f59e0b",go:"fuel"}
                ].map((s,i)=>(
                  <div key={i} onClick={()=>setTab(s.go)} style={{background:"#fff",borderRadius:14,padding:"20px 22px",border:"2px solid "+s.color+"22",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",cursor:"pointer"}}>
                    <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
                    <div style={{fontSize:28,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:13,color:"#6b7280",fontWeight:600}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #e5e7eb"}}>
                  <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700}}>Users by Role</h3>
                  {Object.entries(rc).map(([role,count])=>(
                    <div key={role} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f3f4f6"}}>
                      <span style={{fontSize:13,fontWeight:600}}>{RL[role]||role}</span>
                      <span style={{fontSize:13,fontWeight:800,padding:"2px 10px",borderRadius:20,background:(RC[role]||"#94a3b8")+"22",color:RC[role]||"#94a3b8"}}>{count}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #e5e7eb"}}>
                  <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700}}>Pending Actions</h3>
                  {[{label:"Trip requests awaiting approval",value:pending.length,color:"#f59e0b",go:"trips"},
                    {label:"Fuel requests awaiting approval",value:pf.length,color:"#f97316",go:"fuel"},
                    {label:"Maintenance issues open",value:open.length,color:"#ef4444",go:"maintenance"},
                    {label:"Active trips in progress",value:active.length,color:"#22c55e",go:"trips"}
                  ].map((item,i)=>(
                    <div key={i} onClick={()=>setTab(item.go)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:8,marginBottom:8,background:item.color+"10",cursor:"pointer",border:"1px solid "+item.color+"22"}}>
                      <span style={{fontSize:13}}>{item.label}</span>
                      <span style={{fontSize:16,fontWeight:800,color:item.color}}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==="users" && (
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff"}}><h3 style={{margin:0}}>All System Users ({users.length})</h3></div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:"#f9fafb"}}><TH c="Name"/><TH c="Username"/><TH c="Role"/><TH c="Dept"/><TH c="Status"/><TH c="Actions"/></tr></thead>
                  <tbody>{users.map((u,i)=>(
                    <tr key={u._id} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
                      <TD c={<strong>{u.name}</strong>}/>
                      <TD c={"@"+u.username} s={{color:"#6b7280"}}/>
                      <TD c={<Badge v={RL[u.role]||u.role} map={{[RL[u.role]||u.role]:RC[u.role]||"#94a3b8"}}/>}/>
                      <TD c={u.department||"—"} s={{color:"#6b7280"}}/>
                      <TD c={<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:u.isActive!==false?"#dcfce7":"#fee2e2",color:u.isActive!==false?"#16a34a":"#dc2626"}}>{u.isActive!==false?"Active":"Inactive"}</span>}/>
                      <TD c={
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>toggleUser(u)} style={{padding:"4px 10px",borderRadius:7,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:u.isActive!==false?"#fee2e2":"#dcfce7",color:u.isActive!==false?"#dc2626":"#16a34a"}}>
                            {u.isActive!==false?"Deactivate":"Activate"}
                          </button>
                          <button onClick={()=>setModal({type:"resetpw",user:u,pw:""})} style={{padding:"4px 10px",borderRadius:7,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:"#ede9fe",color:"#7c3aed"}}>
                            Reset PW
                          </button>
                        </div>
                      }/>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="trips" && (
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff"}}><h3 style={{margin:0}}>All Trip Requests ({trips.length})</h3></div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:"#f9fafb"}}><TH c="Requester"/><TH c="Destination"/><TH c="Scheduled"/><TH c="Status"/><TH c="Driver"/><TH c="Vehicle"/><TH c="Action"/></tr></thead>
                  <tbody>{trips.slice(0,30).map((t,i)=>(
                    <tr key={t._id} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
                      <TD c={<strong>{t.requestedBy?.name||"—"}</strong>}/>
                      <TD c={t.destination}/>
                      <TD c={t.scheduledTime?new Date(t.scheduledTime).toLocaleDateString():"—"} s={{color:"#6b7280",whiteSpace:"nowrap"}}/>
                      <TD c={<Badge v={t.status} map={TC}/>}/>
                      <TD c={t.assignedDriver?.name||"—"} s={{color:"#6b7280"}}/>
                      <TD c={t.assignedVehicle?.plateNumber||"—"} s={{color:"#6b7280"}}/>
                      <TD c={!["completed","cancelled","rejected"].includes(t.status)&&(
                        <button onClick={()=>cancelTrip(t)} style={{padding:"4px 10px",borderRadius:7,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:"#fee2e2",color:"#dc2626"}}>Cancel</button>
                      )}/>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="maintenance" && (
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff"}}><h3 style={{margin:0}}>Vehicle Maintenance Issues ({issues.length})</h3></div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:"#f9fafb"}}><TH c="Vehicle"/><TH c="Issue"/><TH c="Severity"/><TH c="Reported By"/><TH c="Status"/><TH c="Date"/><TH c="Action"/></tr></thead>
                  <tbody>{issues.map((issue,i)=>(
                    <tr key={issue._id} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
                      <TD c={<strong>{issue.vehicle?.plateNumber||"—"}</strong>}/>
                      <TD c={issue.issueType}/>
                      <TD c={<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:issue.severity==="Critical"?"#fee2e2":issue.severity==="Moderate"?"#fef3c7":"#fef9c3",color:issue.severity==="Critical"?"#dc2626":issue.severity==="Moderate"?"#d97706":"#92400e"}}>{issue.severity}</span>}/>
                      <TD c={issue.reportedBy?.name||"—"} s={{color:"#6b7280"}}/>
                      <TD c={<Badge v={issue.status?.replace("_"," ")} map={{[issue.status?.replace("_"," ")]:IC[issue.status]||"#94a3b8"}}/>}/>
                      <TD c={new Date(issue.createdAt).toLocaleDateString()} s={{color:"#6b7280",whiteSpace:"nowrap"}}/>
                      <TD c={issue.status!=="resolved"&&(
                        <button onClick={()=>resolveIssue(issue)} style={{padding:"4px 10px",borderRadius:7,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:"#dcfce7",color:"#16a34a"}}>Force Resolve</button>
                      )}/>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="fuel" && (
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff"}}><h3 style={{margin:0}}>Fuel Requests ({fuel.length})</h3></div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:"#f9fafb"}}><TH c="Driver"/><TH c="Vehicle"/><TH c="Fuel"/><TH c="Amount"/><TH c="Status"/><TH c="Auth Code"/><TH c="Date"/><TH c="Action"/></tr></thead>
                  <tbody>{fuel.map((f,i)=>(
                    <tr key={f._id} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
                      <TD c={<strong>{f.driver?.name||"—"}</strong>}/>
                      <TD c={f.vehicle?.plateNumber||"—"}/>
                      <TD c={f.fuelType}/>
                      <TD c={f.requestedAmount+"L"}/>
                      <TD c={<Badge v={f.status} map={FC}/>}/>
                      <TD c={f.authorizationCode||"—"} s={{fontFamily:"monospace",fontSize:11,color:"#22c55e"}}/>
                      <TD c={new Date(f.createdAt).toLocaleDateString()} s={{color:"#6b7280",whiteSpace:"nowrap"}}/>
                      <TD c={f.status==="Pending"&&(
                        <button onClick={()=>approveFuel(f._id)} style={{padding:"4px 10px",borderRadius:7,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:"#dcfce7",color:"#16a34a"}}>Approve</button>
                      )}/>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="broadcast" && (
            <div style={{maxWidth:600}}>
              <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden"}}>
                <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff"}}>
                  <h3 style={{margin:0}}>Broadcast Notification</h3>
                  <p style={{margin:"4px 0 0",fontSize:13,opacity:0.85}}>Send a notification to any role group</p>
                </div>
                <div style={{padding:24}}>
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Target Roles</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {Object.entries(RL).map(([role,label])=>(
                        <button key={role} type="button" onClick={()=>setBc(b=>({...b,roles:b.roles.includes(role)?b.roles.filter(r=>r!==role):[...b.roles,role]}))
                        } style={{padding:"6px 14px",borderRadius:20,border:"2px solid",fontWeight:600,fontSize:12,cursor:"pointer",
                          borderColor:bc.roles.includes(role)?RC[role]:"#e5e7eb",
                          background:bc.roles.includes(role)?RC[role]+"22":"#f9fafb",
                          color:bc.roles.includes(role)?RC[role]:"#374151"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Title</label>
                    <input value={bc.title} onChange={e=>setBc(b=>({...b,title:e.target.value}))} placeholder="Notification title..." style={{width:"100%",padding:"10px 14px",border:"2px solid #e5e7eb",borderRadius:10,fontSize:14,boxSizing:"border-box"}}/>
                  </div>
                  <div style={{marginBottom:20}}>
                    <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Message</label>
                    <textarea value={bc.message} onChange={e=>setBc(b=>({...b,message:e.target.value}))} placeholder="Write your message..." rows={4} style={{width:"100%",padding:"10px 14px",border:"2px solid #e5e7eb",borderRadius:10,fontSize:14,resize:"vertical",boxSizing:"border-box"}}/>
                  </div>
                  {bc.roles.length>0 && <div style={{marginBottom:16,padding:"10px 14px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0",fontSize:13,color:"#15803d"}}>
                    Will notify: {bc.roles.map(r=>RL[r]).join(", ")} — {users.filter(u=>bc.roles.includes(u.role)&&u.isActive!==false).length} active user(s)
                  </div>}
                  <button onClick={sendBc} disabled={sending} style={{width:"100%",padding:13,background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}}>
                    {sending?"Sending...":"Send Broadcast"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}