import { useState } from "react";
import ModalLayout from "../../ui/Modals/ModalLayout";

interface CreateUserModalProps {
  onClose: () => void;
  onCreate: (data: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<void>;
}

export default function CreateUserModal({
  onClose,
  onCreate,
}: CreateUserModalProps) {
  const [createData, setCreateData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await onCreate(createData);
      onClose(); // cerrar tras éxito
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al crear el usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalLayout
      title="REGISTRAR NUEVO USUARIO"
      subtitle="Completa los datos del nuevo usuario"
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Crear usuario"
      loadingText="Creando..."
    >
      <div className="flex flex-col gap-4 py-2">
        {error && (
          <div className="border-2 border-[#d32f2f] bg-[#d32f2f]/10 p-3">
            <p className="text-sm font-bold text-[#b71c1c] font-mono">{error}</p>
          </div>
        )}
        <div>
          <label
            htmlFor="create-username"
            className="block text-xs font-bold uppercase opacity-70 mb-1"
          >
            Nombre
          </label>
          <input
            id="create-username"
            type="text"
            className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
            value={createData.username}
            onChange={(e) =>
              setCreateData({ ...createData, username: e.target.value })
            }
            placeholder="Nombre de usuario"
            required
          />
        </div>
        <div>
          <label
            htmlFor="create-email"
            className="block text-xs font-bold uppercase opacity-70 mb-1"
          >
            Email
          </label>
          <input
            id="create-email"
            type="email"
            className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
            value={createData.email}
            onChange={(e) =>
              setCreateData({ ...createData, email: e.target.value })
            }
            placeholder="correo@empresa.com"
            required
          />
        </div>
        <div>
          <label
            htmlFor="create-password"
            className="block text-xs font-bold uppercase opacity-70 mb-1"
          >
            Contraseña
          </label>
          <input
            id="create-password"
            type="password"
            className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
            value={createData.password}
            onChange={(e) =>
              setCreateData({ ...createData, password: e.target.value })
            }
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
          />
        </div>
        <div>
          <label
            htmlFor="create-role"
            className="block text-xs font-bold uppercase opacity-70 mb-1"
          >
            Rol
          </label>
          <select
            id="create-role"
            className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer"
            value={createData.role}
            onChange={(e) =>
              setCreateData({ ...createData, role: e.target.value })
            }
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
    </ModalLayout>
  );
}