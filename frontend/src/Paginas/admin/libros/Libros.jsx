import React, { useState, useEffect } from "react";
import LayoutAdministrador from "../../../Componentes/LayoutAdministrador.jsx";
import api from "../../../servicios/api.js";
import "./Libros.css";

// Componente de pestañas reutilizable
const TabsNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tabs-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Componente para subir archivo
const FileUpload = ({ label, accept, onChange, value, required = false }) => {
  return (
    <div className="file-upload-container">
      <label className={`file-upload-label ${required ? "required" : ""}`}>
        {label}
      </label>
      <div className="file-upload-area">
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="file-input"
          id={`file-${label.replace(/\s+/g, "-").toLowerCase()}`}
        />
        <div className="file-upload-content">
          {value ? (
            <div className="file-selected">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
              <span>{value.name}</span>
            </div>
          ) : (
            <div className="file-placeholder">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2" />
              </svg>
              <span>Elegir archivo</span>
              <small>No se ha seleccionado ningún archivo</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Formulario de nuevo libro
const FormularioLibro = ({
  onSubmit,
  onCancel,
  libro = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    lib_titulo: "",
    lib_descripcion: "",
    lib_precio: 0,
    lib_descuento: 0,
    lib_idautor: "",
    lib_idcategoria: "",
    lib_ideditorial: "",
    lib_estado: true,
    file: null,
    portada: null,
  });

  const [selectOptions, setSelectOptions] = useState({
    autores: [],
    categorias: [],
    editoriales: [],
  });

  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    cargarOpcionesSelects();
    if (libro) {
      setFormData({
        ...libro,
        file: null,
        portada: null,
      });
    }
  }, [libro]);

  const cargarOpcionesSelects = async () => {
    try {
      setLoadingOptions(true);
      // Consultar API
      const [autores, categorias, editoriales] = await Promise.all([
        api.get("/autores/"),
        api.get("/categorias/"),
        api.get("/editoriales/"),
      ]);

      setSelectOptions({
        autores: autores.data,
        categorias: categorias.data,
        editoriales: editoriales.data,
      });
      setLoadingOptions(false);
    } catch (error) {
      console.error("Error cargando opciones:", error);
      setLoadingOptions(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleFileChange = (campo, archivo) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: archivo,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación básica
    const errores = [];
    if (!formData.lib_titulo.trim()) errores.push("Título es requerido");
    if (!formData.lib_descripcion.trim())
      errores.push("Descripción es requerida");
    if (!formData.lib_idautor) errores.push("Autor es requerido");
    if (!formData.lib_idcategoria) errores.push("Categoría es requerida");
    if (!formData.lib_ideditorial) errores.push("Editorial es requerida");
    if (!libro && !formData.file) errores.push("Archivo PDF es requerido");
    if (!libro && !formData.portada) errores.push("Portada es requerida");

    if (errores.length > 0) {
      alert("Errores:\n" + errores.join("\n"));
      return;
    }

    onSubmit(formData);
  };

  if (loadingOptions) {
    return (
      <div className="form-loading">
        <div className="loading-spinner"></div>
        <p>Cargando formulario...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="libro-form">
      <div className="form-grid">
        {/* Archivos */}
        <div className="form-section files-section">
          <h3>Archivos</h3>
          <FileUpload
            label="Archivo PDF *"
            accept=".pdf"
            value={formData.file}
            onChange={(e) => handleFileChange("file", e.target.files[0])}
            required
          />
          <FileUpload
            label="Portada *"
            accept="image/*"
            value={formData.portada}
            onChange={(e) => handleFileChange("portada", e.target.files[0])}
            required
          />
        </div>

        {/* Información básica */}
        <div className="form-section basic-info">
          <h3>Información Básica</h3>

          <div className="form-group">
            <label className="form-label required">Título</label>
            <input
              type="text"
              value={formData.lib_titulo}
              onChange={(e) => handleInputChange("lib_titulo", e.target.value)}
              className="form-input"
              placeholder="Ingresa el título del libro"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Descripción</label>
            <textarea
              value={formData.lib_descripcion}
              onChange={(e) =>
                handleInputChange("lib_descripcion", e.target.value)
              }
              className="form-textarea"
              placeholder="Describe el contenido del libro"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Precio</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.lib_precio}
              onChange={(e) =>
                handleInputChange("lib_precio", parseFloat(e.target.value) || 0)
              }
              className="form-input"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descuento (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={formData.lib_descuento}
              onChange={(e) =>
                handleInputChange(
                  "lib_descuento",
                  parseInt(e.target.value) || 0
                )
              }
              className="form-input"
              placeholder="0"
            />
          </div>
        </div>

        {/* Selects de relaciones */}
        <div className="form-section relations">
          <h3>Clasificación</h3>

          <div className="form-group">
            <label className="form-label required">Autor</label>
            <select
              value={formData.lib_idautor}
              onChange={(e) =>
                handleInputChange("lib_idautor", Number(e.target.value) || "")
              }
              className="form-select"
              required
            >
              <option value="">Selecciona un autor</option>
              {selectOptions.autores.map((autor) => (
                <option key={autor.aut_id} value={autor.aut_id}>
                  {autor.aut_nombre}
                </option>
              ))}
              <option value="-1">+ Crear nuevo autor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Categoría</label>
            <select
              value={formData.lib_idcategoria}
              onChange={(e) =>
                handleInputChange(
                  "lib_idcategoria",
                  Number(e.target.value) || ""
                )
              }
              className="form-select"
              required
            >
              <option value="">Selecciona una categoría</option>
              {selectOptions.categorias.map((categoria) => (
                <option key={categoria.cat_id} value={categoria.cat_id}>
                  {categoria.cat_nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Editorial</label>
            <select
              value={formData.lib_ideditorial}
              onChange={(e) =>
                handleInputChange(
                  "lib_ideditorial",
                  Number(e.target.value) || ""
                )
              }
              className="form-select"
              required
            >
              <option value="">Selecciona una editorial</option>
              {selectOptions.editoriales.map((editorial) => (
                <option key={editorial.edi_id} value={editorial.edi_id}>
                  {editorial.edi_nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              value={formData.lib_estado}
              onChange={(e) =>
                handleInputChange("lib_estado", e.target.value === "true")
              }
              className="form-select"
            >
              <option value={true}>Activo</option>
              <option value={false}>Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? "Guardando..."
            : libro
            ? "Actualizar Libro"
            : "Crear Libro"}
        </button>
      </div>
    </form>
  );
};

// Tabla de libros
const TablaLibros = ({ libros, onEdit, onDelete, onView, loading }) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Cargando libros...</p>
      </div>
    );
  }

  if (!libros.length) {
    return (
      <div className="table-empty">
        <p>No hay libros registrados</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="libros-table">
        <thead>
          <tr>
            <th>Portada</th>
            <th>Título</th>
            <th>Autor</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Descuento</th>
            <th>Precio Final</th>
            <th>Compras</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {libros.map((libro) => (
            <tr key={libro.id} className="libro-row">
              <td>
                <div className="portada-mini">
                  {libro.portada ? (
                    <img src={libro.portada} alt="Portada" />
                  ) : (
                    <div className="portada-placeholder">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2" />
                      </svg>
                    </div>
                  )}
                </div>
              </td>
              <td className="titulo-cell">
                <div>
                  <strong>{libro.titulo}</strong>
                  <small>
                    {libro.descripcion?.substring(0, 50)}
                    {libro.descripcion?.length > 50 && "..."}
                  </small>
                </div>
              </td>
              <td>{libro.autor}</td>
              <td>{libro.categoria}</td>
              <td>${libro.precio}</td>
              <td>{libro.descuento ? `${libro.descuento}%` : "0%"}</td>
              <td>
                $
                {Math.max(
                  libro.precio - (libro.precio * (libro.descuento || 0)) / 100,
                  5000
                )}
              </td>
              <td>{libro.descargas || 0}</td>
              <td>
                <span
                  className={`status-badge ${
                    libro.estado ? "active" : "inactive"
                  }`}
                >
                  {libro.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                {new Date(libro.fecha || Date.now()).toLocaleDateString()}
              </td>
              <td>
                <div className="acciones-cell">
                  <button
                    className="action-btn view"
                    title="Ver detalles"
                    onClick={() => onView(libro)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
                      <path d="M1.38 8.28a.5.5 0 0 1 0-.566 7.003 7.003 0 0 1 13.24.006.5.5 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28z" />
                    </svg>
                  </button>
                  <button
                    className="action-btn edit"
                    title="Editar libro"
                    onClick={() => onEdit(libro)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Libros = () => {
  const [activeKey, setActiveKey] = useState("libros");
  const [activeTab, setActiveTab] = useState("lista");
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [libroEditando, setLibroEditando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState("success"); // "success" o "error"

  const tabs = [
    {
      key: "lista",
      label: "Lista de Libros",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6z" />
        </svg>
      ),
    },
    {
      key: "nuevo",
      label: "Subir Libro",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (activeTab === "lista") {
      cargarLibros();
    }
  }, [activeTab]);

  const cargarLibros = async () => {
    try {
      setLoading(true);
      // Llama a tu endpoint real
      const response = await api.get("/libros/");
      // Ajusta el setLibros si la respuesta viene envuelta en { libros: [...] } o es array directo
      setLibros(response.data); // O ajusta: response.data.libros si viene así
      setLoading(false);
    } catch (error) {
      console.error("Error cargando libros:", error);
      setLibros([]); // Limpia por si hay error
      setLoading(false);
    }
  };

  const handleSubmitLibro = async (formData) => {
    try {
      setLoading(true);
      const form = new FormData();
      form.append("lib_titulo", formData.lib_titulo);
      form.append("lib_descripcion", formData.lib_descripcion);
      form.append("lib_precio", formData.lib_precio);
      form.append("lib_descuento", formData.lib_descuento);
      form.append("lib_idautor", formData.lib_idautor);
      form.append("lib_idcategoria", formData.lib_idcategoria);
      form.append("lib_ideditorial", formData.lib_ideditorial);
      form.append("lib_estado", formData.lib_estado ? "1" : "0");

      if (formData.file) form.append("file", formData.file);
      if (formData.portada) form.append("portada", formData.portada);

      // POST para crear libro nuevo
      await api.post("/libros/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMensaje("Libro creado correctamente");
      setTipoMensaje("success");
      setActiveTab("lista");
      setShowForm(false);
      setLibroEditando(null);
      cargarLibros();
    } catch (error) {
      console.error("Error guardando libro:", error);
      alert("Error al guardar el libro");
      setLoading(false);
    }
  };

  const handleEditLibro = (libro) => {
    const libroFormateado = {
      lib_titulo: libro.titulo || "",
      lib_descripcion: libro.descripcion || "",
      lib_precio: libro.precio || 0,
      lib_descuento: libro.descuento || 0,
      lib_idautor: libro.idautor || "",
      lib_idcategoria: libro.idcategoria || "",
      lib_ideditorial: libro.ideditorial || "",
      lib_estado: libro.estado ?? true,
      file: null,
      portada: null,
      lib_id: libro.id || null, // importante para PUT
    };

    setLibroEditando(libroFormateado);
    setActiveTab("nuevo");
  };

  const handleUpdateLibro = async (formData) => {
    try {
      setLoading(true);
      const form = new FormData();

      form.append("lib_titulo", formData.lib_titulo);
      form.append("lib_descripcion", formData.lib_descripcion);
      form.append("lib_precio", formData.lib_precio);
      form.append("lib_descuento", formData.lib_descuento);
      form.append("lib_idautor", formData.lib_idautor || "");
      form.append("lib_idcategoria", formData.lib_idcategoria || "");
      form.append("lib_ideditorial", formData.lib_ideditorial || "");
      form.append("lib_estado", formData.lib_estado ? "1" : "0");

      if (formData.file) form.append("file", formData.file);
      if (formData.portada) form.append("portada", formData.portada);

      await api.put(`/libros/${libroEditando.lib_id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMensaje("Libro actualizado correctamente");
      setTipoMensaje("success");

      setActiveTab("lista");
      setLibroEditando(null);
      cargarLibros();
    } catch (error) {
      setMensaje("Error al actualizar el libro");
      setTipoMensaje("error");

      setLoading(false);
    }
  };

  const handleViewLibro = (libro) => {
    console.log("Ver detalles:", libro);
    // TODO: Abrir modal con detalles o navegar a página de detalle
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "lista":
        return (
          <div className="tab-content">
            <div className="lista-header">
              <h3>Lista de Libros</h3>
              <button
                className="btn-primary"
                onClick={() => setActiveTab("nuevo")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2" />
                </svg>
                Subir Nuevo Libro
              </button>
            </div>
            <TablaLibros
              libros={libros}
              onEdit={handleEditLibro}
              onView={handleViewLibro}
              loading={loading}
            />
          </div>
        );

      case "nuevo":
        return (
          <div className="tab-content">
            <div className="form-header">
              <h3>{libroEditando ? "Editar Libro" : "Subir Nuevo Libro"}</h3>
              <p>
                Complete todos los campos requeridos para{" "}
                {libroEditando ? "actualizar" : "subir"} el libro
              </p>
            </div>
            <FormularioLibro
              libro={libroEditando}
              onSubmit={libroEditando ? handleUpdateLibro : handleSubmitLibro}
              onCancel={() => {
                setActiveTab("lista");
                setLibroEditando(null);
              }}
              loading={loading}
            />
          </div>
        );

      default:
        return <div>Contenido no encontrado</div>;
    }
  };

  return (
    <LayoutAdministrador
      activeKey={activeKey}
      onChange={setActiveKey}
      onLogout={() => alert("Cerrar sesión...")}
    >
      <div className="libros-admin">
        <header className="page-header">
          <h1>Gestión de Libros</h1>
          <p className="page-subtitle">
            Administración completa del catálogo de libros
          </p>
        </header>

        <TabsNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "lista") {
              setLibroEditando(null);
            }
          }}
        />

        {mensaje && (
          <div className={`mensaje-flotante ${tipoMensaje}`}>
            <p>{mensaje}</p>
          </div>
        )}

        {renderTabContent()}
      </div>
    </LayoutAdministrador>
  );
};

export default Libros;
