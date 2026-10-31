# Usage: npm run export:web, then python3 scripts/single-file-preview.py [dist] [dist-single]
# Builds one self-contained HTML file from the Expo web export: every JS chunk
# inlined (so nothing is fetched at runtime), fonts as data URIs, a visible
# loading message, and an on-page error message instead of a blank screen.
import os, re, base64, glob
import sys
src=sys.argv[1] if len(sys.argv)>1 else 'dist'; out=sys.argv[2] if len(sys.argv)>2 else 'dist-single'
os.makedirs(out, exist_ok=True)
web=f'{src}/_expo/static/js/web'
def inline_fonts(s):
    return re.sub(r'"(/assets/[^"]+\.ttf)"', lambda m: '"data:font/ttf;base64,'+base64.b64encode(open(src+m.group(1),'rb').read()).decode()+'"', s)
h=open(f'{src}/index.html').read()
order=re.findall(r'<script src="/_expo/static/js/web/([^"]+)" defer></script>', h)
assert order[-1].startswith('entry'), order
allf=sorted(os.listdir(web))
lazy=[f for f in allf if f not in order]
seq=order[:-1]+lazy+order[-1:]
parts=[]
for f in seq:
    s=inline_fonts(open(f'{web}/{f}').read())
    if f.startswith('entry'):
        n=s.count('if(c?.has(u))return;'); assert n==1, n
        s=s.replace('if(c?.has(u))return;','return;')  # all chunks are already on the page
    # Route through an in-memory location and history: the viewer's sandboxed
    # frame may have an opaque origin or an about:srcdoc address, where the
    # real History API refuses to change the path.
    s=re.sub(r'window\.location(?!\s*=[^=])', 'window.__L', s)
    s=s.replace('window.history', 'window.__H')
    s=re.sub(r'(?<![\w.$])location\.(href|origin|pathname)', r'window.__L.\1', s)
    assert '</script' not in s.lower(), f
    parts.append(f'<script>/* {f} */\n{s}\n</script>')
h=re.sub(r'<script src="/_expo[^"]+" defer></script>','',h)
h=h.replace('<link rel="icon" href="/favicon.ico" />','')
boot="""<script>
(function(){
  var base='https://quran-storybook.app/', stack=[{u:base,s:null}], i=0;
  function abs(u){ return new URL(u==null?stack[i].u:String(u), stack[i].u).href; }
  function part(k){ return new URL(stack[i].u)[k]; }
  window.__L={
    get href(){return stack[i].u}, get pathname(){return part('pathname')}, get search(){return part('search')},
    get hash(){return part('hash')}, get host(){return part('host')}, get hostname(){return part('hostname')},
    origin:'https://quran-storybook.app', protocol:'https:', port:'',
    reload:function(){ location.reload(); }, toString:function(){ return stack[i].u; },
    assign:function(u){ window.__H.pushState(null,'',u); }, replace:function(u){ window.__H.replaceState(null,'',u); }
  };
  window.__H={
    get state(){return stack[i].s}, get length(){return stack.length}, scrollRestoration:'auto',
    pushState:function(st,t,u){ stack=stack.slice(0,i+1); stack.push({u:abs(u),s:st}); i++; },
    replaceState:function(st,t,u){ stack[i]={u:abs(u),s:st}; },
    go:function(n){ var j=Math.max(0,Math.min(stack.length-1,i+(n||0))); if(j===i) return; i=j;
      setTimeout(function(){ window.dispatchEvent(new PopStateEvent('popstate',{state:stack[i].s})); },0); },
    back:function(){ this.go(-1); }, forward:function(){ this.go(1); }
  };
  function show(msg){
    var el=document.getElementById('boot');
    if(!el){el=document.createElement('div');el.id='boot';document.body.appendChild(el);}
    el.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:#0b0806;color:#f3e3c2;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px;z-index:99';
    el.innerHTML='<b style="font-size:20px">Quran Storybook could not start</b><span>'+msg+'</span><span style="opacity:.7;font-size:13px">Try reloading, or open it in Chrome, Safari or Edge.</span>';
  }
  window.__bootFail=show;
  window.addEventListener('error',function(e){ if(!window.__booted) show(String(e.message||e)); });
  setTimeout(function(){ if(!window.__booted && document.getElementById('boot')) document.getElementById('boot').querySelector('span').textContent='Still loading… this can take a moment on slower devices.'; },15000);
})();
</script>"""
loading='<div id="boot" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:#0b0806;color:#f3e3c2;font:16px/1.5 system-ui,sans-serif;z-index:99"><b style="font-size:22px">Quran Storybook</b><span>Opening the book…</span></div>'
h=h.replace('<head>','<head>'+boot,1)
h=h.replace('<div id="root"></div>','<div id="root"></div>'+loading+''.join(parts))
open(f'{out}/index.html','w').write(h)
print(len(h)/1e6,'MB', seq)
