import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Activity, ArrowUpRight, BarChart3, Check, ChevronDown, CircleHelp, ImagePlus, Layers3, ScanLine, Settings2, Sparkles, X} from 'lucide-react'
import './style.css'

const models = [
  {id:'gated_fusion',name:'Gated Fusion',kind:'Multimodal',description:'Learns how much to weight text and image features.'},
  {id:'early_fusion',name:'Early Fusion',kind:'Multimodal',description:'Concatenates text and image features before classification.'},
  {id:'cross_attention',name:'Cross-Attention Fusion',kind:'Multimodal',description:'Lets text tokens attend to different image regions.'},
  {id:'distilbert',name:'DistilBERT',kind:'Text only',description:'Predicts sentiment from the post and target aspect.'},
  {id:'mobilenet_v3_small',name:'MobileNetV3-Small',kind:'Image only',description:'Predicts sentiment using the image alone.'},
]
const labels = ['positive','neutral','negative']
const demo = {sentiment:'positive',confidence:.87,probabilities:{positive:.87,neutral:.09,negative:.04},model:'gated_fusion',example:true}
const percent = value => new Intl.NumberFormat('en',{style:'percent',maximumFractionDigits:1}).format(value)

function App(){
  const [modelId,setModel] = useState(models[0].id)
  const [text,setText] = useState('')
  const [aspect,setAspect] = useState('')
  const [file,setFile] = useState(null)
  const [preview,setPreview] = useState('')
  const [result,setResult] = useState(null)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const [drag,setDrag] = useState(false)
  const [endpoint,setEndpoint] = useState(import.meta.env.VITE_PREDICT_URL || '/predict')
  const input = useRef(null)
  const dialog = useRef(null)
  const output = useRef(null)
  const model = models.find(item=>item.id===modelId)
  const needsText = model.kind!=='Image only'
  const needsImage = model.kind!=='Text only'

  useEffect(()=>{
    if(!file){setPreview('');return}
    const url=URL.createObjectURL(file)
    setPreview(url)
    return ()=>URL.revokeObjectURL(url)
  },[file])

  function selectImage(image){
    if(!image) return
    if(!['image/jpeg','image/png'].includes(image.type)){
      setError('Choose a JPG or PNG image.');return
    }
    setFile(image);setResult(null);setError('')
  }

  function reveal(next){
    setResult(next)
    if(window.matchMedia('(max-width: 800px)').matches){
      requestAnimationFrame(()=>output.current?.scrollIntoView({block:'start'}))
    }
  }

  async function analyze(event){
    event.preventDefault()
    setError('');setResult(null)
    if(needsImage&&!file){setError('Upload a JPG or PNG image for this model.');input.current?.focus();return}
    if(needsText&&(!text.trim()||!aspect.trim())){setError('Enter both the post text and a target aspect.');return}
    const body=new FormData()
    body.append('model',modelId)
    if(needsText){body.append('text',text.trim());body.append('aspect',aspect.trim())}
    if(needsImage)body.append('image',file)
    setBusy(true)
    try{
      const response = await fetch(endpoint,{method:'POST',body,signal:AbortSignal.timeout(45000)})
      if(!response.ok){
        const payload=await response.json().catch(()=>null)
        throw new Error(typeof payload?.detail==='string'?payload.detail:
          response.status===404||response.status>=500?'Prediction API is unavailable. Check the endpoint in API settings.':`Prediction request failed (HTTP ${response.status}).`)
      }
      const data=await response.json().catch(()=>null)
      const validScore=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1
      if(!data||!labels.includes(data.sentiment)||!validScore(data.confidence)||
        !labels.every(label=>validScore(data.probabilities?.[label]))){
        throw new Error('The API response did not match the prediction format. Check the endpoint in API settings.')
      }
      reveal({...data,model:data.model||modelId,example:false})
    }catch(err){
      setError(err.name==='TimeoutError'?'The prediction request timed out. Try again.':
        err instanceof TypeError?'Could not reach the prediction API. Check the endpoint and backend CORS settings.':err.message)
    }finally{setBusy(false)}
  }

  return <>
    <header><div className="top"><div className="brand"><span className="brand-icon"><Layers3 size={20}/></span><span>ImplicitMABSA<small>Multimodal sentiment analysis</small></span></div><button className="settings" type="button" onClick={()=>dialog.current.showModal()}><Settings2 size={17}/> API settings</button></div></header>
    <main className="mx-auto">
      <section className="hero">
        <div><h1>Aspect-Based<br className="hero-break"/> Sentiment Analysis</h1><p>Use a post’s text and image to predict sentiment toward a target you specify, such as food, service, or a product.</p></div>
        <div className="motif" aria-hidden="true"><div className="motif-grid"/><div className="motif-orbit one"/><div className="motif-orbit two"/><div className="motif-core"><Activity size={55} strokeWidth={1.25}/></div><span className="motif-node a">Aa</span><span className="motif-node b"><ImagePlus size={23}/></span><span className="motif-node c"><ScanLine size={21}/></span></div>
      </section>
      <div className="workspace">
        <form className="panel input-panel" onSubmit={analyze}>
          <div className="panel-title"><span className="tile"><Layers3 size={19}/></span><div><h2>Post and target aspect</h2><p>Select a model to see which inputs it uses.</p></div></div>
          <fieldset disabled={busy}>
          <label htmlFor="model">Model</label>
          <div className="select-wrap"><select id="model" value={modelId} onChange={event=>{setModel(event.target.value);setError('');setResult(null)}}>{models.map(item=><option value={item.id} key={item.id}>{item.name} · {item.kind}</option>)}</select><ChevronDown size={17}/></div>
          <p className="hint model-hint">{model.description}</p>
          {needsImage&&<><label htmlFor="image">Post image</label>
          <div className={'drop '+(drag?'drag':'')} onDragOver={event=>{event.preventDefault();if(!busy)setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={event=>{event.preventDefault();setDrag(false);if(!busy)selectImage(event.dataTransfer.files[0])}}>
            <input ref={input} id="image" type="file" accept="image/jpeg,image/png" onChange={event=>{selectImage(event.target.files[0]);event.target.value=''}}/>
            {file?<><img src={preview} alt="Uploaded post preview"/><span className="filename">{file.name}</span><button className="remove" type="button" aria-label="Remove image" onClick={()=>{setFile(null);setResult(null);setError('')}}><X size={17}/></button></>:<><span className="upload-icon"><ImagePlus size={21}/></span><span><strong>Click to upload</strong> or drag and drop</span><small>JPG or PNG</small></>}
          </div></>}
          {needsText&&<><label htmlFor="text">Post text</label><textarea id="text" required rows={3} placeholder="Paste the text accompanying your post…" value={text} onChange={event=>{setText(event.target.value);setResult(null)}}/>
          <label htmlFor="aspect">Target aspect</label><input required id="aspect" placeholder="e.g., coffee, service, or product" value={aspect} onChange={event=>{setAspect(event.target.value);setResult(null)}}/></>}
          <button className="primary" disabled={busy} type="submit"><Sparkles size={17}/>{busy?'Analyzing sentiment…':'Analyze sentiment'}</button>
          </fieldset>
          {error&&<p className="error" role="alert">{error}</p>}
        </form>
        <section className="panel results" ref={output} aria-busy={busy}>
          <div className="panel-title"><span className="tile"><BarChart3 size={20}/></span><div><h2>Sentiment prediction</h2><p>Predicted label and confidence by sentiment class</p></div></div>
          <div aria-live="polite">
          {result?<div className="result-content">
            {result.example&&<p className="example-note"><CircleHelp size={16}/> Example result using illustrative scores</p>}
            <div className={'verdict '+result.sentiment}><div><small>Predicted sentiment</small><h3>{result.sentiment}</h3></div><div className="confidence"><strong>{percent(result.confidence)}</strong><small>Confidence</small></div></div>
            <h3 className="breakdown">Class probabilities</h3>
            {labels.map(label=><div className="score" key={label}><div><span>{label}</span><strong>{percent(result.probabilities[label])}</strong></div><div className="track"><div className={label} style={{width:percent(result.probabilities[label])}}/></div></div>)}
            <div className="model-used"><Check size={16}/> {models.find(item=>item.id===result.model)?.name || result.model}</div>
          </div>:<div className="empty"><div className="empty-icon"><BarChart3 size={32} strokeWidth={1.45}/></div><h3>{busy?'Analyzing your post':'Awaiting a prediction'}</h3><p>{busy?'Waiting for the prediction API.':'Select a model, add its inputs, and choose Analyze sentiment.'}</p>{!busy&&<button type="button" className="example" onClick={()=>reveal(demo)}>View example result <ArrowUpRight size={15}/></button>}</div>}
          </div>
        </section>
      </div>
      <footer><span>ImplicitMABSA</span><span>Positive, neutral, and negative sentiment</span></footer>
    </main>
    <dialog ref={dialog}><form method="dialog"><div className="dialog-title"><h2>API settings</h2><button aria-label="Close settings" formNoValidate><X size={20}/></button></div><p>Enter the full URL of your FastAPI prediction endpoint, or use <code>/predict</code> for a same-origin endpoint.</p><label htmlFor="endpoint">Prediction endpoint</label><input id="endpoint" value={endpoint} onChange={event=>setEndpoint(event.target.value)} required pattern="(/predict|https?://.+)" /><button className="primary">Done</button></form></dialog>
  </>
}

createRoot(document.getElementById('root')).render(<App/>)
