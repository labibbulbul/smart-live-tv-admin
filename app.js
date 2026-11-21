(() => {
  const cfg = window.SMART_LIVE_TV_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const loginView = $("loginView"), appView = $("appView");
  let supabase = null, channels = [], countries = [], categories = [];
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

  function notify(message, error=false) {
    const n=$("notice"); n.textContent=message; n.classList.remove("hidden","error");
    if(error) n.classList.add("error");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function setLoginMessage(m){$("loginMessage").textContent=m||"";}
  function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function init() {
    if(!configured){setLoginMessage("Setup needed: add your Supabase URL and Publishable key in config.js.");return;}
    if(!window.supabase){setLoginMessage("Could not load Supabase library. Check your internet connection.");return;}
    supabase=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);
    supabase.auth.getSession().then(({data})=>{if(data.session) showApp(data.session.user);});
    supabase.auth.onAuthStateChange((_event,session)=>{if(session) showApp(session.user); else showLogin();});
  }
  function showLogin(){loginView.classList.remove("hidden");appView.classList.add("hidden");$("logoutBtn").classList.add("hidden");}
  async function showApp(user){
    loginView.classList.add("hidden");appView.classList.remove("hidden");$("logoutBtn").classList.remove("hidden");$("userEmail").textContent=user.email||"Admin";
    await loadAll();
  }
  async function loadAll(){
    try{
      const results=await Promise.all([
        supabase.from("countries").select("*").order("sort_order"),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("channels").select("*, countries(name), categories(name)").order("sort_order")
      ]);
      for(const r of results) if(r.error) throw r.error;
      countries=results[0].data||[]; categories=results[1].data||[]; channels=results[2].data||[];
      $("totalChannels").textContent=channels.length;
      $("activeChannels").textContent=channels.filter(x=>x.is_active).length;
      $("totalCountries").textContent=countries.length;
      $("totalCategories").textContent=categories.length;
      renderChannels(); renderCountries(); renderCategories(); fillSelects();
    }catch(e){notify("Could not load data: "+e.message,true);}
  }
  function renderChannels(){
    const q=$("channelSearch").value.toLowerCase(), f=$("statusFilter").value;
    const list=channels.filter(c=>(c.name||"").toLowerCase().includes(q)&&(f==="all"||(f==="active"?c.is_active:!c.is_active)));
    $("channelRows").innerHTML=list.length?list.map(c=>`<tr>
      <td><div class="channel-name">${c.logo_url?`<img src="${escapeHtml(c.logo_url)}" alt="" onerror="this.style.display='none'">`:""}<span>${escapeHtml(c.name)}</span></div></td>
      <td>${escapeHtml(c.countries?.name||"—")}</td><td>${escapeHtml(c.categories?.name||"—")}</td>
      <td><span class="status ${c.is_active?"":"off"}">${c.is_active?"Active":"Inactive"}</span></td>
      <td><div class="actions"><button class="small-btn" data-edit="${c.id}">Edit</button><button class="small-btn danger" data-delete="${c.id}">Delete</button></div></td>
    </tr>`).join(""):'<tr><td colspan="5" class="empty">No channels found.</td></tr>';
    $("channelRows").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editChannel(b.dataset.edit)));
    $("channelRows").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteChannel(b.dataset.delete)));
  }
  function renderCountries(){
    $("countryList").innerHTML=countries.map(c=>`<div class="simple-item"><span>${escapeHtml(c.flag_emoji||"🌐")} &nbsp;${escapeHtml(c.name)} <small class="muted">${escapeHtml(c.code||"")}</small></span><button class="small-btn danger" data-country-delete="${c.id}">Delete</button></div>`).join("")||'<p class="muted">No countries added yet.</p>';
    $("countryList").querySelectorAll("[data-country-delete]").forEach(b=>b.addEventListener("click",()=>deleteSimple("countries",b.dataset.countryDelete,"country")));
  }
  function renderCategories(){
    $("categoryList").innerHTML=categories.map(c=>`<div class="simple-item"><span>${escapeHtml(c.name)}</span><button class="small-btn danger" data-category-delete="${c.id}">Delete</button></div>`).join("")||'<p class="muted">No categories added yet.</p>';
    $("categoryList").querySelectorAll("[data-category-delete]").forEach(b=>b.addEventListener("click",()=>deleteSimple("categories",b.dataset.categoryDelete,"category")));
  }
  function fillSelects(){
    $("chCountry").innerHTML='<option value="">Select country</option>'+countries.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    $("chCategory").innerHTML='<option value="">Select category</option>'+categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  }
  function openDialog(c=null){
    $("channelForm").reset(); $("channelId").value=c?.id||""; $("dialogTitle").textContent=c?"Edit channel":"Add channel"; $("formMessage").textContent="";
    $("chName").value=c?.name||"";$("chStream").value=c?.stream_url||"";$("chLogo").value=c?.logo_url||"";
    $("chCountry").value=c?.country_id||"";$("chCategory").value=c?.category_id||"";
    $("chLanguage").value=c?.language||"";$("chQuality").value=c?.quality||"";
    $("chDescription").value=c?.description||"";$("chActive").checked=c?!!c.is_active:true;
    $("chFeatured").checked=!!c?.is_featured;$("chSort").value=c?.sort_order??0;
    $("channelDialog").showModal();
  }
  function editChannel(id){const c=channels.find(x=>x.id===id);if(c)openDialog(c);}
  async function deleteChannel(id){
    const c=channels.find(x=>x.id===id);if(!c||!confirm(`Delete channel "${c.name}"? This cannot be undone.`))return;
    const {error}=await supabase.from("channels").delete().eq("id",id);if(error)notify(error.message,true);else{notify("Channel deleted.");await loadAll();}
  }
  async function deleteSimple(table,id,label){
    if(!confirm(`Delete this ${label}? If channels use it, deletion may be blocked.`))return;
    const {error}=await supabase.from(table).delete().eq("id",id);if(error)notify(error.message,true);else{notify(`${label} deleted.`);await loadAll();}
  }
  $("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();setLoginMessage("Signing in…");
    if(!supabase){setLoginMessage("First configure config.js with your Supabase project URL and publishable key.");return;}
    const {error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    setLoginMessage(error?error.message:"");
  });
  $("logoutBtn").addEventListener("click",async()=>{if(supabase)await supabase.auth.signOut();});
  $("addChannelBtn").addEventListener("click",()=>openDialog());
  $("closeDialog").addEventListener("click",()=>$("channelDialog").close());
  $("cancelDialog").addEventListener("click",()=>$("channelDialog").close());
  $("channelForm").addEventListener("submit",async e=>{
    e.preventDefault();$("formMessage").textContent="Saving…";
    const id=$("channelId").value;
    const row={name:$("chName").value.trim(),stream_url:$("chStream").value.trim(),logo_url:$("chLogo").value.trim()||null,
      country_id:$("chCountry").value||null,category_id:$("chCategory").value||null,language:$("chLanguage").value.trim()||null,
      quality:$("chQuality").value.trim()||null,description:$("chDescription").value.trim()||null,
      is_active:$("chActive").checked,is_featured:$("chFeatured").checked,sort_order:Number($("chSort").value)||0,updated_at:new Date().toISOString()};
    const result=id?await supabase.from("channels").update(row).eq("id",id):await supabase.from("channels").insert(row);
    if(result.error){$("formMessage").textContent=result.error.message;return;}
    $("channelDialog").close();notify(id?"Channel updated.":"Channel added.");await loadAll();
  });
  $("countryForm").addEventListener("submit",async e=>{
    e.preventDefault();const row={name:$("countryName").value.trim(),code:$("countryCode").value.trim().toUpperCase()||null,flag_emoji:$("countryFlag").value.trim()||null};
    const {error}=await supabase.from("countries").insert(row);if(error)notify(error.message,true);else{e.target.reset();notify("Country added.");await loadAll();}
  });
  $("categoryForm").addEventListener("submit",async e=>{
    e.preventDefault();const {error}=await supabase.from("categories").insert({name:$("categoryName").value.trim()});
    if(error)notify(error.message,true);else{e.target.reset();notify("Category added.");await loadAll();}
  });
  $("channelSearch").addEventListener("input",renderChannels);$("statusFilter").addEventListener("change",renderChannels);
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
    ["channels","countries","categories"].forEach(t=>$(`${t}Panel`).classList.toggle("hidden",t!==b.dataset.tab));
  }));
  init();
})();
