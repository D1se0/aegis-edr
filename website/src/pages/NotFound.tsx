import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-5 py-24 text-center">
      <ShieldAlert size={40} className="text-aegis-cyan" />
      <h1 className="text-3xl font-bold text-slate-50">Pagina no encontrada</h1>
      <p className="text-slate-400">La ruta que buscas no existe. Puede que el enlace este mal escrito o haya cambiado.</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link to="/" className="glass-btn-primary">Volver al inicio</Link>
        <Link to="/docs" className="glass-btn">Ir a la documentacion</Link>
      </div>
    </div>
  )
}
