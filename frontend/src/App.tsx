import { useAuthStore } from './store/useAuthStore'
import api from './api/axios'

function App() {
  const { user, setUser } = useAuthStore()

  const probarConexion = async () => {
    try {
      // 1. Primero pedimos la cookie CSRF por seguridad (Requisito de Sanctum)
      await api.get('http://localhost:8000/sanctum/csrf-cookie');
      
      // 2. Hacemos una petición de prueba (Laravel trae esta ruta por defecto)
      // Como no estamos logueados, nos dará un error 401 (Unauthorized), ¡lo cual es bueno porque Sanctum nos está protegiendo!
      const response = await api.get('/user');
      setUser(response.data.name);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setUser("Invitado (Sanctum bloqueó el acceso. ¡Funciona!)");
      } else {
        setUser("Error de conexión");
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bang-brown text-white gap-6">
      <h1 className="text-4xl font-bold bg-bang-red p-8 rounded-lg shadow-2xl border-4 border-yellow-600">
        ¡BIENVENIDO AL BANG! 🤠
      </h1>
      
      <button 
        onClick={probarConexion}
        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded shadow transition-colors"
      >
        Probar Conexión Backend
      </button>

      {user && (
        <div className="mt-4 p-4 bg-black/50 rounded text-xl">
          Estado del usuario: <span className="text-yellow-400">{user}</span>
        </div>
      )}
    </div>
  )
}

export default App