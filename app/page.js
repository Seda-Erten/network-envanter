"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardCharts from "./components/DashboardCharts";

const TYPE_BADGE = { switch: "SW", router: "RT", firewall: "FW", modem: "MDM", sunucu: "SRV", patch_panel: "PP", access_point: "AP" };
const TYPE_LABEL = { switch: "Switch", router: "Router", firewall: "Firewall", modem: "Modem/ONT", sunucu: "Sunucu", patch_panel: "Patch Panel", access_point: "Access Point" };

export default function Home() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [connections, setConnections] = useState([]);
  const [racks, setRacks] = useState([]);
  const [portLabels, setPortLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRackId, setSelectedRackId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideEmptyPorts, setHideEmptyPorts] = useState(false);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isRackModalOpen, setIsRackModalOpen] = useState(false);
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [selectedPortDevice, setSelectedPortDevice] = useState(null);

  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editingRackId, setEditingRackId] = useState(null);

  const [deviceForm, setDeviceForm] = useState({
    name: "", type: "switch", location: "", ip_address: "", brand: "",
    rack_id: "", rack_u: "", port_count: 24, size_u: 1, status: "aktif",
  });
  const [rackForm, setRackForm] = useState({ name: "", size_u: 42, location: "" });
  const [connForm, setConnForm] = useState({
    device_a_id: "", port_a: "", device_b_id: "", port_b: "",
    cable_type: "Cat6", color: "#3b82f6",
  });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  async function loadAll() {
    setLoading(true);
    const [devRes, connRes, rackRes, labelRes] = await Promise.all([
      fetch("/api/devices"), fetch("/api/connections"),
      fetch("/api/racks"), fetch("/api/port-labels"),
    ]);
    if (devRes.status === 401) { router.push("/login"); return; }
    setDevices(await devRes.json());
    setConnections(await connRes.json());
    const rackData = await rackRes.json();
    setRacks(rackData);
    if (rackData.length > 0 && !selectedRackId) setSelectedRackId(rackData[0].id.toString());
    setPortLabels(await labelRes.json());
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, [router]);

  function openRackModal(rack = null) {
    setError("");
    if (rack) { setEditingRackId(rack.id); setRackForm({ name: rack.name, size_u: rack.size_u, location: rack.location || "" }); }
    else { setEditingRackId(null); setRackForm({ name: "", size_u: 42, location: "" }); }
    setIsRackModalOpen(true);
  }
  async function handleSaveRack(e) {
    e.preventDefault(); setError("");
    const url = editingRackId ? `/api/racks/${editingRackId}` : "/api/racks";
    const res = await fetch(url, { method: editingRackId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rackForm) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Hata"); return; }
    setIsRackModalOpen(false); loadAll();
  }
  async function handleDeleteRack(id) {
    setConfirmDialog({
      isOpen: true,
      title: "Kabini Sil",
      message: "Bu kabini silmek istediğinize emin misiniz?",
      onConfirm: async () => {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        await fetch(`/api/racks/${id}`, { method: "DELETE" }); loadAll();
      }
    });
  }

  function openDeviceModal(device = null) {
    setError("");
    if (device) {
      setEditingDeviceId(device.id);
      setDeviceForm({ name: device.name, type: device.type, location: device.location || "", ip_address: device.ip_address || "", brand: device.brand || "", rack_id: device.rack_id || "", rack_u: device.rack_u || "", port_count: device.port_count || 24, size_u: device.size_u || 1, status: device.status || "aktif" });
    } else {
      setEditingDeviceId(null);
      setDeviceForm({ name: "", type: "switch", location: "", ip_address: "", brand: "", rack_id: "", rack_u: "", port_count: 24, size_u: 1, status: "aktif" });
    }
    setIsDeviceModalOpen(true);
  }
  async function handleSaveDevice(e) {
    e.preventDefault(); setError("");
    const url = editingDeviceId ? `/api/devices/${editingDeviceId}` : "/api/devices";
    const res = await fetch(url, { method: editingDeviceId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(deviceForm) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Hata"); return; }
    setIsDeviceModalOpen(false); loadAll();
  }
  async function handleDeleteDevice(id) {
    setConfirmDialog({
      isOpen: true,
      title: "Cihazı Sil",
      message: "Bu cihazı silmek istediğinize emin misiniz?",
      onConfirm: async () => {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        await fetch(`/api/devices/${id}`, { method: "DELETE" }); setIsDeviceModalOpen(false); loadAll();
      }
    });
  }

  function handleEmptySlotClick(rackId, uNumber) {
    setEditingDeviceId(null);
    setDeviceForm({ name: "", type: "switch", location: "", ip_address: "", brand: "", rack_id: rackId, rack_u: uNumber, port_count: 24, size_u: 1, status: "aktif" });
    setError(""); setIsDeviceModalOpen(true);
  }

  async function handleSaveConnection(e) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(connForm) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Hata"); return; }
    setIsConnModalOpen(false); loadAll();
  }
  async function handleDeleteConnection(id) {
    setConfirmDialog({
      isOpen: true,
      title: "Kabloyu Sök",
      message: "Bu kablo bağlantısını sökmek istediğinize emin misiniz?",
      onConfirm: async () => {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        await fetch(`/api/connections/${id}`, { method: "DELETE" }); loadAll();
      }
    });
  }
  async function savePortLabel(deviceId, portNumber, label) {
    await fetch("/api/port-labels", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, port_number: portNumber, label }),
    });
    loadAll();
  }
  function getPortLabel(deviceId, portNumber) {
    const found = portLabels.find(l => l.device_id === deviceId && l.port_number === portNumber);
    return found ? found.label : "";
  }

  function openPortModal(device) {
    setSelectedPortDevice(device); setIsPortModalOpen(true);
  }

  function renderCabinet(rack) {
    if (!rack) return null;
    const elements = [];
    for (let u = rack.size_u; u >= 1; u--) {
      const deviceInU = devices.find(d => d.rack_id?.toString() === rack.id.toString() && d.rack_u === u);
      if (deviceInU) {
        const size = deviceInU.size_u || 1;
        elements.push(
          <div key={u} className="rack-u-slot" style={{height: `${size * 34}px`, flexShrink: 0}}>
            <div className="u-number" style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>{u}U</div>
            <div className="u-content occupied" style={{height:'100%'}} onClick={() => openPortModal(deviceInU)}>
              <div className="rack-device" style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <div><span className={`led ${deviceInU.status}`} /><span className="rack-device-name">{deviceInU.name}</span><span className="rack-device-type">({TYPE_BADGE[deviceInU.type] || deviceInU.type})</span></div>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{deviceInU.port_count || 24} Port · {deviceInU.brand || ''}</div>
              </div>
            </div>
          </div>
        );
        u -= (size - 1);
      } else {
        elements.push(
          <div key={u} className="rack-u-slot" style={{height:'34px',flexShrink:0}}>
            <div className="u-number">{u}U</div>
            <div className="u-content empty" onClick={() => handleEmptySlotClick(rack.id, u)}>
              <span className="empty-text">Boş</span>
            </div>
          </div>
        );
      }
    }
    return (
      <div className="rack-cabinet" style={{minWidth:'420px',margin:'0 auto'}}>
        <div className="rack-roof">{rack.name}</div>
        {elements}
        <div className="rack-floor"></div>
      </div>
    );
  }

  const selectedRack = racks.find(r => r.id.toString() === selectedRackId);
  const patchPanels = devices.filter(d => d.type === 'patch_panel');
  const switches = devices.filter(d => d.type === 'switch' || d.type === 'router');

  return (
    <div className="shell">
      <header className="masthead" style={{borderBottom:'none',marginBottom:20}}>
        <div>
          <p className="masthead-eyebrow">Yapılandırılmış Kablolama Sistemi</p>
          <h1>Ağ Envanter Yönetimi</h1>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <Link href="/topology" className="submit-btn" style={{textDecoration:'none'}}>🗺️ Topoloji</Link>
          <button className="submit-btn" style={{background:'transparent',border:'1px solid var(--border)',color:'var(--text-dim)',boxShadow:'none'}} onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});router.push("/login");}}>Çıkış</button>
        </div>
      </header>

      <div style={{display:'flex',gap:8,marginBottom:30,paddingBottom:15,borderBottom:'1px solid var(--border)',overflowX:'auto'}}>
        {[
          {id:'dashboard',label:'📊 Özet'},
          {id:'rack',label:'🏢 Sistem Odası'},
          {id:'ports',label:'🔌 Port Haritası'},
          {id:'rooms',label:'🏢 Odalar / Saha'},
          {id:'connections',label:'🔗 Kablolama'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:'10px 20px',fontSize:14,fontWeight:600,border:'none',borderRadius:8,cursor:'pointer',whiteSpace:'nowrap',
            background:activeTab===t.id?'var(--cyan)':'transparent',
            color:activeTab===t.id?'#fff':'var(--text-dim)',
            boxShadow:activeTab===t.id?'0 4px 12px rgba(2,132,199,0.3)':'none',
            transition:'all 0.2s ease',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{marginBottom:20}}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 Cihaz, oda veya port ara... (Örn: Muhasebe, PP-02, Core Switch)"
          style={{width:'100%',padding:'12px 16px',borderRadius:10,border:'1px solid var(--border)',fontSize:14,fontFamily:'var(--font-sans)',background:'var(--panel)',boxSizing:'border-box',outline:'none',transition:'border 0.2s'}}
        />
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-title">Kabin (Rack)</div>
              <div className="stat-value text-cyan">{racks.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Switch / Router</div>
              <div className="stat-value text-amber">{switches.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Patch Panel</div>
              <div className="stat-value text-green">{patchPanels.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Kablo Bağlantısı</div>
              <div className="stat-value" style={{color:'var(--text)'}}>{connections.length}</div>
            </div>
            {(() => {
              const totalPorts = devices.reduce((sum, d) => sum + (d.port_count || 24), 0);
              const usedPorts = connections.length * 2;
              const freeports = totalPorts - usedPorts;
              const pct = totalPorts > 0 ? Math.round((usedPorts / totalPorts) * 100) : 0;
              return (
                <div className="stat-card">
                  <div className="stat-title">Port Doluluk</div>
                  <div className="stat-value" style={{color: pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--amber)' : 'var(--green)'}}>%{pct}</div>
                  <div style={{fontSize:11,color:'var(--text-dim)',marginTop:4}}>{usedPorts} dolu / {freeports} boş</div>
                </div>
              );
            })()}
          </div>

          {devices.length === 0 && racks.length === 0 && !loading && (
            <div className="panel" style={{padding:30,textAlign:'center'}}>
              <h2 style={{margin:'0 0 16px',fontSize:20}}>Sisteme Hoş Geldiniz!</h2>
              <p style={{color:'var(--text-dim)',margin:'0 0 24px',lineHeight:1.8,maxWidth:600,marginLeft:'auto',marginRight:'auto'}}>
                Ağ altyapınızı 3 adımda kurun:
              </p>
              <div style={{display:'flex',gap:20,justifyContent:'center',flexWrap:'wrap'}}>
                <div style={{background:'rgba(2,132,199,0.05)',border:'1px solid rgba(2,132,199,0.15)',borderRadius:12,padding:20,width:200,textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:8}}>1️⃣</div>
                  <div style={{fontWeight:700,marginBottom:4}}>Kabin Oluştur</div>
                  <div style={{fontSize:12,color:'var(--text-dim)'}}>Sistem odasına 42U kabin ekleyin</div>
                  <button className="submit-btn" style={{marginTop:12,fontSize:12,padding:'6px 14px'}} onClick={()=>openRackModal()}>+ Kabin Ekle</button>
                </div>
                <div style={{background:'rgba(217,119,6,0.05)',border:'1px solid rgba(217,119,6,0.15)',borderRadius:12,padding:20,width:200,textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:8}}>2️⃣</div>
                  <div style={{fontWeight:700,marginBottom:4}}>Cihaz Yerleştir</div>
                  <div style={{fontSize:12,color:'var(--text-dim)'}}>Switch ve Patch Panel ekleyin</div>
                </div>
                <div style={{background:'rgba(22,163,74,0.05)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:12,padding:20,width:200,textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:8}}>3️⃣</div>
                  <div style={{fontWeight:700,marginBottom:4}}>Port Eşle</div>
                  <div style={{fontSize:12,color:'var(--text-dim)'}}>Panel portlarını etiketleyip switch portlarına bağlayın</div>
                </div>
              </div>
            </div>
          )}
            
          {!loading && devices.length > 0 && <DashboardCharts devices={devices} />}
        </>
      )}

      {activeTab === 'rack' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div>
              <h2 style={{margin:0,fontSize:18}}>Sistem Odası Kabinleri</h2>
              <p className="text-dim" style={{margin:'4px 0 0',fontSize:13}}>Boş bir rafa tıklayarak cihaz ekleyebilirsiniz. Dolu rafa tıklayarak portları görebilirsiniz.</p>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              {racks.length > 0 && (
                <select value={selectedRackId} onChange={e=>setSelectedRackId(e.target.value)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border)',fontWeight:600,fontFamily:'var(--font-sans)'}}>
                  {racks.map(r=><option key={r.id} value={r.id}>{r.name} ({r.size_u}U)</option>)}
                </select>
              )}
              <button className="submit-btn" onClick={()=>openRackModal()}>+ Kabin Ekle</button>
            </div>
          </div>

          {racks.length === 0 ? (
            <div className="empty-note" style={{padding:40}}>Henüz kabin tanımlanmamış. Sağ üstteki "Kabin Ekle" butonunu kullanın.</div>
          ) : (
            <>
              <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
                {devices.filter(d => d.rack_id?.toString() === selectedRackId).map(d => (
                  <div key={d.id} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 14px',fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                    <span className={`led ${d.status}`}></span>
                    <strong>{d.name}</strong>
                    <span className="text-dim">({TYPE_LABEL[d.type]}) · {d.rack_u}U · {d.port_count} Port</span>
                  </div>
                ))}
              </div>

              <div className="rack-cabinet-container">
                {!loading && selectedRackId && renderCabinet(selectedRack)}
              </div>

              {selectedRack && (
                <div style={{textAlign:'center',marginTop:20}}>
                  <button className="icon-btn" onClick={()=>openRackModal(selectedRack)} style={{marginRight:8}}>Kabini Düzenle</button>
                  <button className="icon-btn" onClick={()=>handleDeleteRack(selectedRack.id)} style={{color:'var(--red)'}}>Kabini Sil</button>
                </div>
              )}
            </>
          )}
        </>
      )}


      {activeTab === 'ports' && (
        <>
          <div style={{marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
            <div>
              <h2 style={{margin:0,fontSize:18}}>Port Haritası — Uçtan Uça İzleme</h2>
              <p className="text-dim" style={{margin:'4px 0 0',fontSize:13}}>
                Her Patch Panel portuna "nereden geliyor" etiketi yazın, ardından o portu bir Switch portuna bağlayın.
              </p>
            </div>
            <button
              onClick={() => setHideEmptyPorts(!hideEmptyPorts)}
              style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border)',background:hideEmptyPorts?'var(--cyan)':'#fff',color:hideEmptyPorts?'#fff':'var(--text-dim)',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.2s'}}
            >{hideEmptyPorts ? 'Boş Portlar Gizli' : 'Boş Portları Gizle'}</button>
          </div>

          {patchPanels.length === 0 && switches.length === 0 && (
            <div className="empty-note" style={{padding:40}}>
              Henüz cihaz yok. Önce "Sistem Odası" sekmesinden bir kabin oluşturup Switch ve Patch Panel ekleyin.
            </div>
          )}

          {patchPanels.map(panel => {
            const panelRack = racks.find(r => r.id === panel.rack_id);
            return (
              <div key={panel.id} className="panel" style={{marginBottom:24}}>
                <div style={{padding:'16px 20px',background:'rgba(15,23,42,0.03)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div className="device-type-badge" style={{width:36,height:36,fontSize:11}}>PP</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{panel.name}</div>
                      <div style={{fontSize:12,color:'var(--text-dim)'}}>{panelRack ? `${panelRack.name} · ${panel.rack_u}U` : 'Kabine atanmamış'} · {panel.port_count} Port</div>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={()=>openDeviceModal(panel)}>Düzenle</button>
                </div>

                <div style={{overflowX:'auto'}}>
                  <table className="netbox-table">
                    <thead>
                      <tr>
                        <th style={{width:60}}>Port</th>
                        <th>Nereden Geliyor? (Etiket)</th>
                        <th style={{width:40,textAlign:'center'}}>↔</th>
                        <th>Bağlı Switch Portu</th>
                        <th style={{width:100}}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length: panel.port_count || 24}, (_, i) => {
                        const portNum = i + 1;
                        const portNumStr = portNum.toString();
                        const label = getPortLabel(panel.id, portNum);

                        const conn = connections.find(c =>
                          (c.device_a_id === panel.id && c.port_a === portNumStr) ||
                          (c.device_b_id === panel.id && c.port_b === portNumStr)
                        );

                        if (hideEmptyPorts && !conn && !label) return null;

                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          const matchLabel = label && label.toLowerCase().includes(q);
                          const matchPanel = panel.name.toLowerCase().includes(q);
                          if (!matchLabel && !matchPanel) return null;
                        }

                        let connectedSwitch = null;
                        let connectedPort = null;
                        if (conn) {
                          if (conn.device_a_id === panel.id) {
                            connectedSwitch = conn.device_b_name;
                            connectedPort = conn.port_b;
                          } else {
                            connectedSwitch = conn.device_a_name;
                            connectedPort = conn.port_a;
                          }
                        }

                        return (
                          <tr key={portNum}>
                            <td>
                              <div style={{width:32,height:32,borderRadius:'50%',background:conn?'#3b82f6':(label?'#f59e0b':'#e2e8f0'),color:conn||label?'#fff':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13}}>
                                {portNum}
                              </div>
                            </td>
                            <td>
                              <input
                                style={{width:'100%',padding:'6px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontFamily:'var(--font-sans)',background:label?'rgba(245,158,11,0.05)':'#fff'}}
                                placeholder="Örn: 1. Kat Müdür Odası"
                                defaultValue={label}
                                onBlur={(e) => {
                                  if (e.target.value !== label) savePortLabel(panel.id, portNum, e.target.value);
                                }}
                              />
                            </td>
                            <td style={{textAlign:'center',color:'var(--text-dim)',fontSize:18}}>{conn ? '🔗' : '—'}</td>
                            <td>
                              {conn ? (
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <span className={`led aktif`}></span>
                                  <strong>{connectedSwitch}</strong>
                                  <span style={{background:'rgba(2,132,199,0.1)',color:'var(--cyan)',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600}}>Port {connectedPort}</span>
                                </div>
                              ) : (
                                <span style={{color:'var(--text-dim)',fontSize:12,fontStyle:'italic'}}>Bağlı değil</span>
                              )}
                            </td>
                            <td>
                              {conn ? (
                                <button className="icon-btn" style={{color:'var(--red)',fontSize:11}} onClick={()=>handleDeleteConnection(conn.id)}>Sök</button>
                              ) : (
                                <button className="icon-btn" style={{fontSize:11}} onClick={()=>{
                                  setConnForm({device_a_id: panel.id.toString(), port_a: portNumStr, device_b_id:'', port_b:'', cable_type:'Cat6', color:'#3b82f6'});
                                  setError(''); setIsConnModalOpen(true);
                                }}>Bağla</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {switches.length > 0 && (
            <>
              <div style={{marginTop:32,marginBottom:16}}>
                <h3 style={{margin:0,fontSize:16}}>Switch Port Durumları</h3>
                <p className="text-dim" style={{margin:'4px 0 0',fontSize:13}}>Her switch portunun neye bağlı olduğu ve hangi odaya hizmet verdiği.</p>
              </div>

              {switches.map(sw => {
                const swRack = racks.find(r => r.id === sw.rack_id);
                return (
                  <div key={sw.id} className="panel" style={{marginBottom:24}}>
                    <div style={{padding:'16px 20px',background:'rgba(15,23,42,0.03)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="device-type-badge" style={{width:36,height:36,fontSize:11,color:'var(--amber)'}}>SW</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:15}}>{sw.name}</div>
                          <div style={{fontSize:12,color:'var(--text-dim)'}}>{swRack ? `${swRack.name} · ${sw.rack_u}U` : ''} · {sw.port_count} Port{sw.ip_address ? ` · ${sw.ip_address}` : ''}</div>
                        </div>
                      </div>
                      <button className="icon-btn" onClick={()=>openDeviceModal(sw)}>Düzenle</button>
                    </div>

                    <div style={{padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',gap:10}}>
                      {Array.from({length: sw.port_count || 24}, (_, i) => {
                        const portNum = (i + 1).toString();
                        const conn = connections.find(c =>
                          (c.device_a_id === sw.id && c.port_a === portNum) ||
                          (c.device_b_id === sw.id && c.port_b === portNum)
                        );

                        let otherName = null;
                        let otherPort = null;
                        let otherDeviceId = null;
                        if (conn) {
                          if (conn.device_a_id === sw.id) {
                            otherName = conn.device_b_name; otherPort = conn.port_b; otherDeviceId = conn.device_b_id;
                          } else {
                            otherName = conn.device_a_name; otherPort = conn.port_a; otherDeviceId = conn.device_a_id;
                          }
                        }

                        const roomLabel = otherDeviceId ? getPortLabel(otherDeviceId, parseInt(otherPort)) : '';

                        return (
                          <div key={portNum} style={{
                            padding:'10px 12px',borderRadius:8,fontSize:12,
                            border:`1px solid ${conn ? 'rgba(2,132,199,0.3)' : 'var(--border)'}`,
                            background: conn ? 'rgba(2,132,199,0.03)' : '#fff',
                            display:'flex',alignItems:'center',gap:10,
                          }}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:conn?'var(--cyan)':'#e2e8f0',color:conn?'#fff':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,flexShrink:0}}>
                              {i+1}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              {conn ? (
                                <>
                                  <div style={{fontWeight:600,fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{otherName} (P{otherPort})</div>
                                  {roomLabel && <div style={{fontSize:11,color:'var(--amber)',marginTop:2}}>📍 {roomLabel}</div>}
                                </>
                              ) : (
                                <span style={{color:'var(--text-dim)',fontStyle:'italic'}}>Boş</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}


      {activeTab === 'connections' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h2 style={{margin:0,fontSize:18}}>Kablolama Kayıtları</h2>
            <button className="submit-btn" onClick={()=>{setConnForm({device_a_id:'',port_a:'',device_b_id:'',port_b:'',cable_type:'Cat6',color:'#3b82f6'});setError('');setIsConnModalOpen(true);}} style={{background:'var(--amber)'}}>+ Yeni Kablo Çek</button>
          </div>

          {connections.length === 0 ? (
            <div className="empty-note" style={{padding:40}}>Henüz kablo bağlantısı yok. "Port Haritası" sekmesinden panel portlarını switch portlarına bağlayabilirsiniz.</div>
          ) : (
            <div className="panel" style={{overflowX:'auto'}}>
              <table className="netbox-table">
                <thead><tr><th>Kablo</th><th>Cihaz A</th><th>Port</th><th style={{textAlign:'center'}}>↔</th><th>Cihaz B</th><th>Port</th><th>İşlem</th></tr></thead>
                <tbody>
                  {connections.filter(c => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (c.device_a_name||'').toLowerCase().includes(q) || (c.device_b_name||'').toLowerCase().includes(q) || (c.cable_type||'').toLowerCase().includes(q);
                  }).map(c => (
                    <tr key={c.id}>
                      <td><div style={{display:'flex',alignItems:'center',gap:8}}><div className="color-swatch" style={{backgroundColor:c.color||'#3b82f6'}}></div>{c.cable_type}</div></td>
                      <td className="font-semibold">{c.device_a_name}</td>
                      <td className="text-cyan" style={{fontWeight:700}}>{c.port_a}</td>
                      <td className="text-dim" style={{textAlign:'center'}}>↔</td>
                      <td className="font-semibold">{c.device_b_name}</td>
                      <td className="text-cyan" style={{fontWeight:700}}>{c.port_b}</td>
                      <td><button className="icon-btn" onClick={()=>handleDeleteConnection(c.id)} style={{color:'var(--red)'}}>Sök</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'rooms' && (
        <div className="panel" style={{padding:20}}>
          <h2 style={{marginTop:0,marginBottom:10}}>Saha ve Odalar Envanteri</h2>
          <p className="text-dim" style={{marginBottom:20}}>Aşağıdaki liste, sistem odasındaki Patch Panel etiketlerinden otomatik olarak oluşturulmuştur. Odalardaki prizlerin HANGİ panel portuna ve oradan HANGİ switch portuna gittiğini uçtan uca gösterir.</p>
          
          <div style={{overflowX:'auto'}}>
            <table className="netbox-table">
              <thead>
                <tr>
                  <th>Oda / Konum</th>
                  <th>Duvar Prizi</th>
                  <th>Patch Panel (Sistem Odası)</th>
                  <th style={{width:40,textAlign:'center'}}>↔</th>
                  <th>Switch Bağlantısı</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  portLabels.reduce((acc, lbl) => {
                    const parts = lbl.label.split('·').map(p=>p.trim());
                    let roomName = lbl.label;
                    let prizName = "-";
                    if (parts.length > 1) {
                      prizName = parts.pop();
                      roomName = parts.join(' · ');
                    }
                    if (!acc[roomName]) acc[roomName] = [];
                    
                    const panel = devices.find(d => d.id === lbl.device_id);
                    const conn = connections.find(c => 
                      (c.device_a_id === lbl.device_id && c.port_a === lbl.port_number.toString()) ||
                      (c.device_b_id === lbl.device_id && c.port_b === lbl.port_number.toString())
                    );
                    
                    let swName = "-";
                    let swPort = "-";
                    if(conn) {
                      if(conn.device_a_id === lbl.device_id) { swName = conn.device_b_name; swPort = conn.port_b; }
                      else { swName = conn.device_a_name; swPort = conn.port_a; }
                    }
                    
                    acc[roomName].push({
                      priz: prizName,
                      panelName: panel ? panel.name : "Bilinmeyen",
                      panelPort: lbl.port_number,
                      swName,
                      swPort,
                      hasConn: !!conn
                    });
                    return acc;
                  }, {})
                )
                .sort((a,b) => a[0].localeCompare(b[0]))
                .filter(([roomName, sockets]) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return roomName.toLowerCase().includes(q) || sockets.some(s => s.panelName.toLowerCase().includes(q) || s.swName.toLowerCase().includes(q) || s.priz.toLowerCase().includes(q));
                })
                .map(([roomName, sockets]) => {
                  return sockets.map((sock, i) => (
                    <tr key={`${roomName}-${i}`}>
                      {i === 0 && <td rowSpan={sockets.length} style={{fontWeight:600,background:'rgba(2,132,199,0.03)',verticalAlign:'middle',borderRight:'1px solid var(--border)'}}>{roomName}</td>}
                      <td>{sock.priz}</td>
                      <td>
                        <strong>{sock.panelName}</strong>
                        <span style={{marginLeft:8,background:'rgba(245,158,11,0.1)',color:'#d97706',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600}}>Port {sock.panelPort}</span>
                      </td>
                      <td style={{textAlign:'center',color:'var(--text-dim)'}}>{sock.hasConn ? '🔗' : '—'}</td>
                      <td>
                        {sock.hasConn ? (
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span className="led aktif"></span>
                            <strong>{sock.swName}</strong>
                            <span style={{background:'rgba(2,132,199,0.1)',color:'var(--cyan)',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600}}>Port {sock.swPort}</span>
                          </div>
                        ) : (
                          <span style={{color:'var(--text-dim)',fontSize:12,fontStyle:'italic'}}>Bağlı değil</span>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isRackModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div className="panel form" style={{width:'100%',maxWidth:420,margin:20,background:'#fff',position:'relative'}}>
            <button onClick={()=>setIsRackModalOpen(false)} style={{position:'absolute',top:15,right:15,background:'transparent',border:'none',fontSize:20,cursor:'pointer'}}>✕</button>
            <h2 style={{marginTop:0,fontSize:18}}>{editingRackId ? 'Kabini Düzenle' : 'Yeni Kabin Oluştur'}</h2>
            {error && <div className="error-note">{error}</div>}
            <form onSubmit={handleSaveRack}>
              <div className="field" style={{marginBottom:15}}><label>Kabin Adı</label><input value={rackForm.name} onChange={e=>setRackForm({...rackForm, name:e.target.value})} placeholder="Örn: Ana Sistem Kabini" required /></div>
              <div className="form-row">
                <div className="field"><label>Boyut (U)</label><input type="number" value={rackForm.size_u} onChange={e=>setRackForm({...rackForm, size_u:parseInt(e.target.value)||42})} /></div>
                <div className="field"><label>Konum</label><input value={rackForm.location} onChange={e=>setRackForm({...rackForm, location:e.target.value})} placeholder="Örn: Zemin Kat" /></div>
              </div>
              <button type="submit" className="submit-btn" style={{marginTop:20,width:'100%'}}>{editingRackId ? 'Güncelle' : 'Kabin Oluştur'}</button>
            </form>
          </div>
        </div>
      )}

      {isDeviceModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div className="panel form" style={{width:'100%',maxWidth:500,margin:20,background:'#fff',position:'relative'}}>
            <button onClick={()=>setIsDeviceModalOpen(false)} style={{position:'absolute',top:15,right:15,background:'transparent',border:'none',fontSize:20,cursor:'pointer'}}>✕</button>
            <h2 style={{marginTop:0,fontSize:18}}>{editingDeviceId ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}</h2>
            {error && <div className="error-note">{error}</div>}
            <form onSubmit={handleSaveDevice}>
              <div className="form-row">
                <div className="field"><label>Cihaz Adı</label><input value={deviceForm.name} onChange={e=>setDeviceForm({...deviceForm,name:e.target.value})} required placeholder="Örn: Cisco Catalyst 2960" /></div>
                <div className="field"><label>Tür</label><select value={deviceForm.type} onChange={e=>setDeviceForm({...deviceForm,type:e.target.value})}>
                  <option value="switch">Switch</option><option value="router">Router</option><option value="firewall">Firewall</option><option value="modem">Modem / ONT</option><option value="patch_panel">Patch Panel</option><option value="sunucu">Sunucu</option><option value="access_point">Access Point</option>
                </select></div>
              </div>
              <div className="form-row" style={{marginTop:15}}>
                <div className="field"><label>Marka</label><input value={deviceForm.brand} onChange={e=>setDeviceForm({...deviceForm,brand:e.target.value})} placeholder="Örn: Cisco, HP" /></div>
                <div className="field"><label>Port Sayısı</label><input type="number" value={deviceForm.port_count} onChange={e=>setDeviceForm({...deviceForm,port_count:parseInt(e.target.value)||24})} /></div>
              </div>
              <div className="form-row" style={{marginTop:15}}>
                <div className="field"><label>Dolap (Rack)</label><select value={deviceForm.rack_id} onChange={e=>setDeviceForm({...deviceForm,rack_id:e.target.value})}><option value="">Seçiniz...</option>{racks.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div className="field"><label>Raf Pozisyonu (U)</label><input type="number" value={deviceForm.rack_u} onChange={e=>setDeviceForm({...deviceForm,rack_u:e.target.value})} placeholder="Örn: 42" /></div>
              </div>
              {(deviceForm.type === 'switch' || deviceForm.type === 'router') && (
                <div className="form-row" style={{marginTop:15}}>
                  <div className="field"><label>IP Adresi</label><input value={deviceForm.ip_address} onChange={e=>setDeviceForm({...deviceForm,ip_address:e.target.value})} placeholder="Örn: 192.168.1.1" /></div>
                  <div className="field"><label>Boyut (U)</label><input type="number" value={deviceForm.size_u} onChange={e=>setDeviceForm({...deviceForm,size_u:parseInt(e.target.value)||1})} /></div>
                </div>
              )}
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button type="submit" className="submit-btn" style={{flex:1}}>{editingDeviceId ? 'Güncelle' : 'Cihaz Ekle'}</button>
                {editingDeviceId && <button type="button" className="submit-btn" style={{background:'var(--red)'}} onClick={()=>handleDeleteDevice(editingDeviceId)}>Sil</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {isConnModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div className="panel form" style={{width:'100%',maxWidth:520,margin:20,background:'#fff',position:'relative'}}>
            <button onClick={()=>setIsConnModalOpen(false)} style={{position:'absolute',top:15,right:15,background:'transparent',border:'none',fontSize:20,cursor:'pointer'}}>✕</button>
            <h2 style={{marginTop:0,fontSize:18}}>Patch Cord Bağla</h2>
            <p className="text-dim" style={{margin:'-8px 0 16px',fontSize:13}}>Patch Panel portundan Switch portuna kablo çekin.</p>
            {error && <div className="error-note">{error}</div>}
            <form onSubmit={handleSaveConnection}>
              <div className="form-row">
                <div className="field"><label>Uç A (Cihaz)</label>
                  <select value={connForm.device_a_id} onChange={e=>setConnForm({...connForm,device_a_id:e.target.value})} required>
                    <option value="">Seçiniz...</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name} ({TYPE_LABEL[d.type]})</option>)}
                  </select>
                </div>
                <div className="field"><label>Port A</label><input value={connForm.port_a} onChange={e=>setConnForm({...connForm,port_a:e.target.value})} required placeholder="Örn: 1" /></div>
              </div>
              <div className="form-row" style={{marginTop:15}}>
                <div className="field"><label>Uç B (Cihaz)</label>
                  <select value={connForm.device_b_id} onChange={e=>setConnForm({...connForm,device_b_id:e.target.value})} required>
                    <option value="">Seçiniz...</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name} ({TYPE_LABEL[d.type]})</option>)}
                  </select>
                </div>
                <div className="field"><label>Port B</label><input value={connForm.port_b} onChange={e=>setConnForm({...connForm,port_b:e.target.value})} required placeholder="Örn: 5" /></div>
              </div>
              <div className="form-row" style={{marginTop:15}}>
                <div className="field"><label>Kablo Tipi</label>
                  <select value={connForm.cable_type || 'Cat6'} onChange={e=>setConnForm({...connForm,cable_type:e.target.value})}>
                    <option value="Cat5e">Cat5e</option>
                    <option value="Cat6">Cat6</option>
                    <option value="Cat6a">Cat6a</option>
                    <option value="Fiber (OM3)">Fiber (OM3)</option>
                    <option value="Fiber (OM4)">Fiber (OM4)</option>
                    <option value="Fiber (OS2)">Fiber (OS2)</option>
                  </select>
                </div>
                <div className="field"><label>Kablo Rengi</label>
                  <select value={connForm.color || 'blue'} onChange={e=>setConnForm({...connForm,color:e.target.value})}>
                    <option value="blue">Mavi (Kullanıcı Ağları)</option>
                    <option value="green">Yeşil (Kameralar)</option>
                    <option value="red">Kırmızı (WAN/Güvenlik)</option>
                    <option value="yellow">Sarı (Sunucular/Yedek)</option>
                    <option value="purple">Mor (Omurga / OM3)</option>
                    <option value="magenta">Pembe (Yüksek Hız OM4)</option>
                    <option value="orange">Turuncu (Diğer)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="submit-btn" style={{marginTop:20,width:'100%',background:'var(--cyan)'}}>Kabloyu Bağla</button>
            </form>
          </div>
        </div>
      )}

      {isPortModalOpen && selectedPortDevice && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div className="panel" style={{width:'100%',maxWidth:700,margin:20,background:'#fff',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'20px 24px',background:'#f8fafc',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h2 style={{margin:0,fontSize:18}}>{selectedPortDevice.name} — Portlar</h2>
                <p className="text-dim" style={{margin:'4px 0 0',fontSize:12}}>{TYPE_LABEL[selectedPortDevice.type]} · {selectedPortDevice.port_count} Port</p>
              </div>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <button onClick={() => { setIsPortModalOpen(false); openDeviceModal(selectedPortDevice); }} style={{background:'transparent',border:'1px solid var(--border)',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--text)'}}>✏️ Düzenle</button>
                <button onClick={() => { setIsPortModalOpen(false); handleDeleteDevice(selectedPortDevice.id); }} style={{background:'transparent',border:'1px solid var(--red)',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--red)'}}>🗑️ Sil</button>
                <button onClick={()=>setIsPortModalOpen(false)} style={{background:'transparent',border:'none',fontSize:24,cursor:'pointer',marginLeft:10}}>✕</button>
              </div>
            </div>
            <div style={{padding:20,maxHeight:'60vh',overflowY:'auto'}}>
              <table className="netbox-table">
                <thead><tr><th>Port</th><th>{selectedPortDevice.type === 'patch_panel' ? 'Etiket (Nereden Geliyor?)' : 'Durum'}</th><th>Bağlantı</th></tr></thead>
                <tbody>
                  {Array.from({length: selectedPortDevice.port_count || 24}, (_, i) => {
                    const portNum = (i+1).toString();
                    const conn = connections.find(c =>
                      (c.device_a_id === selectedPortDevice.id && c.port_a === portNum) ||
                      (c.device_b_id === selectedPortDevice.id && c.port_b === portNum)
                    );
                    let otherName = '', otherPort = '', otherDevId = null;
                    if (conn) {
                      if (conn.device_a_id === selectedPortDevice.id) { otherName = conn.device_b_name; otherPort = conn.port_b; otherDevId = conn.device_b_id; }
                      else { otherName = conn.device_a_name; otherPort = conn.port_a; otherDevId = conn.device_a_id; }
                    }
                    const label = getPortLabel(selectedPortDevice.id, i+1);
                    const roomFromOther = otherDevId ? getPortLabel(otherDevId, parseInt(otherPort)) : '';

                    return (
                      <tr key={portNum}>
                        <td><div style={{width:28,height:28,borderRadius:'50%',background:conn?'var(--cyan)':'#e2e8f0',color:conn?'#fff':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12}}>{i+1}</div></td>
                        <td>{selectedPortDevice.type === 'patch_panel' ? (label || <span className="text-dim" style={{fontStyle:'italic'}}>Etiket yok</span>) : (roomFromOther ? <span style={{color:'var(--amber)'}}>📍 {roomFromOther}</span> : (conn ? 'Dolu' : <span className="text-dim">Boş</span>))}</td>
                        <td>{conn ? <span><strong>{otherName}</strong> <span className="text-dim">(Port {otherPort})</span></span> : <span className="text-dim">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {confirmDialog.isOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div className="panel" style={{width:'100%',maxWidth:400,background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
            <div style={{padding:'20px 24px',background:'#fff',borderBottom:'1px solid var(--border)'}}>
              <h2 style={{margin:0,fontSize:18,color:'var(--slate-800)'}}>⚠️ {confirmDialog.title}</h2>
            </div>
            <div style={{padding:'24px',fontSize:15,color:'var(--slate-600)',lineHeight:1.5}}>
              {confirmDialog.message}
            </div>
            <div style={{padding:'16px 24px',background:'#f8fafc',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end',gap:12}}>
              <button onClick={()=>setConfirmDialog(prev=>({...prev,isOpen:false}))} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border)',background:'#fff',fontWeight:600,cursor:'pointer',color:'var(--text-dim)'}}>Vazgeç</button>
              <button onClick={confirmDialog.onConfirm} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'var(--red)',color:'#fff',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 12px rgba(239, 68, 68, 0.3)'}}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
