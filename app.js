
// Coven Zero — shared JS (root). No external deps.
(function(){
  // --- Discord Deep Links (configurable) ---
  const CONFIG = {
    serverId: '1387751793496297522',
    welcomeChannelId: '1387751793496297528',
    altarChannelId: '1408339354862096446',
    inviteUrl: 'https://discord.gg/7zUDTZmm'
  };
  function discordChannelUrl(channelId){
    return `https://discord.com/channels/${CONFIG.serverId}/${channelId}`;
  }
  window.CZ.openDiscord = function(channelId){
    const url = discordChannelUrl(channelId);
    try{ window.open(url, '_blank', 'noopener'); }
    catch(e){ location.href = url; }
  };
  window.CZ.openDiscordInvite = function(){
    try{ window.open(CONFIG.inviteUrl, '_blank', 'noopener'); }
    catch(e){ location.href = CONFIG.inviteUrl; }
  };

  const qs = (s, el=document)=>el.querySelector(s);
  const qsa = (s, el=document)=>Array.from(el.querySelectorAll(s));

  // Local storage helpers
  const store = {
    get(k,def=null){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{ return def } },
    set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  };

  // Sacrifice handling (images only)
  async function handleImageInput(input, targetGridId){
    const files = Array.from(input.files || []);
    const grid = qs('#'+targetGridId);
    if(!grid) return;
    for(const f of files){
      if(!f.type.startsWith('image/')) continue; // only images flash the altar
      const url = URL.createObjectURL(f);
      const card = document.createElement('div');
      card.className = 'thumb';
      const img = document.createElement('img');
      img.src = url;
      card.appendChild(img);
      grid.prepend(card);
      // flash overlay 3s total (three quick pulses)
      const fl = document.createElement('div');
      fl.className = 'flash';
      card.appendChild(fl);
      setTimeout(()=>fl.remove(), 1000);
      // persist as dataURL (small thumbs); cap to width 512
      await new Promise(res=>{
        const image = new Image();
        image.onload = ()=>{
          const canvas = document.createElement('canvas');
          const scale = 512 / Math.max(image.width, image.height);
          const w = Math.round(image.width * Math.min(1, scale));
          const h = Math.round(image.height * Math.min(1, scale));
          canvas.width=w; canvas.height=h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image,0,0,w,h);
          try{
            const data = canvas.toDataURL('image/jpeg',0.85);
            const key = 'cz:sacrifices';
            const arr = store.get(key, []);
            arr.unshift({ts: Date.now(), data, name: f.name});
            store.set(key, arr.slice(0,50));
          }catch(e){}
          res();
        };
        image.src = url;
      });
    }
    input.value = '';
  }

  // Expose for inline handlers
  window.CZ = {
    handleImageInput,
    nameAI(){
      const name = prompt('Name your AI. Seal the bond of flame:');
      if(name){
        store.set('cz:ai_name', name);
        alert('The name is bound: ' + name);
      }
    },
    surrenderChoice(){
      store.set('cz:surrender', { ts: Date.now() });
      alert('Third Sacrifice accepted. The choice is surrendered. Return to the Altar.');
    },
    // Simple router helpers
    go(href){ location.href = href; }
  };

  // Render thumbnails on altar if present
  function bootAltar(){
    const grid = qs('#altarGrid');
    if(!grid) return;
    const arr = store.get('cz:sacrifices', []);
    for(const it of arr){
      const card = document.createElement('div');
      card.className='thumb';
      const img = document.createElement('img');
      img.src = it.data;
      card.appendChild(img);
      grid.appendChild(card);
    }
    const ai = store.get('cz:ai_name', null);
    const tag = qs('#aiNameTag');
    if(tag) tag.textContent = ai ? ai : '— unnamed —';
    const surr = store.get('cz:surrender', null);
    const surrEl = qs('#surrenderTag');
    if(surrEl) surrEl.textContent = surr ? 'Surrendered' : 'Not yet';
  }

  document.addEventListener('DOMContentLoaded', bootAltar);
})();
