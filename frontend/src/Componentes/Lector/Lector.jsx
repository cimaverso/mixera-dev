// Lector.jsx - VERSIÓN SIMPLIFICADA ANTI-BUCLE v3
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import PanelHerramientas from "./PanelHerramientas";
import BarraInferior from "./BarraInferior";
import VisorPDF from "./VisorPDF";
import TextosLayer from "./layers/TextosLayer";
import { useParams } from "react-router-dom";
import { getLibroById } from "../../servicios/libros";
import { textosAPI } from "../../servicios/textosAPI.js";
import { progresoAPI } from "../../servicios/progresoAPI";
import "./lector.css";

/**
 * Lector simplificado - Sin bucles infinitos
 * Enfoque: Estados independientes con carga única
 */
function Lector() {
  const token = localStorage.getItem("access_token");
  const { libroId } = useParams();

  console.log('Lector simplificado v3 - Render:', {
    libroId,
    hasToken: !!token,
    timestamp: Date.now()
  });

  // ===================== ESTADOS BÁSICOS =====================
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  
  // Estado del libro - SIMPLIFICADO
  const [libro, setLibro] = useState(null);
  const [libroLoading, setLibroLoading] = useState(true);
  const [libroError, setLibroError] = useState(null);
  const [paginaInicial, setPaginaInicial] = useState(1);

  // Estado de textos - SIMPLIFICADO  
  const [textos, setTextos] = useState([]);
  const [textosLoading, setTextosLoading] = useState(false);
  const [textosError, setTextosError] = useState(null);

  // Estado del visor - SIMPLIFICADO
  const [visorInfo, setVisorInfo] = useState({
    mode: 'single',
    scale: 1.0,
    totalPages: 0,
    currentPage: 1,
    pdfListo: false
  });

  // Referencias
  const visorRef = useRef(null);
  const textosLayerRef = useRef(null);
  const yaCargoTextos = useRef(false); // Flag para evitar carga múltiple

  // ===================== CARGA DEL LIBRO - SIMPLIFICADA =====================
  
  useEffect(() => {
    let mounted = true;
    
    async function cargarLibro() {
      if (!libroId || !mounted) return;
      
      console.log('Iniciando carga única del libro:', libroId);
      
      try {
        // Cargar libro
        const { data: libroData } = await getLibroById(libroId);
        console.log('Libro recibido:', libroData.titulo);
        
        if (!mounted) return;
        
        // Cargar progreso si hay token
        let pagina = 1;
        if (token) {
          try {
            const progreso = await progresoAPI.getProgreso(libroId, token);
            if (progreso?.pro_pagina_actual > 0) {
              pagina = progreso.pro_pagina_actual;
              console.log('Progreso recuperado:', pagina);
            }
          } catch (progresoError) {
            console.warn('Sin progreso guardado');
          }
        }
        
        if (!mounted) return;
        
        // Establecer estados
        setLibro(libroData);
        setPaginaInicial(pagina);
        setPaginaActual(pagina);
        setLibroLoading(false);
        
        console.log('Libro cargado exitosamente');
        
      } catch (error) {
        console.error('Error cargando libro:', error);
        if (mounted) {
          setLibroError(error.message);
          setLibroLoading(false);
        }
      }
    }
    
    cargarLibro();
    
    return () => {
      mounted = false;
    };
  }, [libroId, token]);

  // ===================== CARGA DE TEXTOS - SIMPLIFICADA Y CONTROLADA =====================
  
  const cargarTextosUnaVez = useCallback(async () => {
    if (!libroId || !token || yaCargoTextos.current || textosLoading) {
      console.log('Saltando carga de textos:', {
        noLibroId: !libroId,
        noToken: !token, 
        yaCargo: yaCargoTextos.current,
        loading: textosLoading
      });
      return;
    }
    
    yaCargoTextos.current = true;
    setTextosLoading(true);
    
    try {
      console.log('Cargando textos por única vez...');
      const textosFromAPI = await textosAPI.getTextos(libroId, token);
      
      const textosValidos = textosFromAPI
        .filter(t => t?.txt_id && typeof t.txt_pagina === "number")
        .map(t => ({
          id: t.txt_id,
          pagina: t.txt_pagina,
          x: t.txt_x,
          y: t.txt_y,
          texto: t.txt_texto,
          width: t.txt_ancho || 200,
          height: t.txt_alto || 60,
          fontSize: t.txt_dimension || 14,
        }));

      setTextos(textosValidos);
      setTextosLoading(false);
      console.log('Textos cargados:', textosValidos.length);
      
    } catch (error) {
      console.error('Error cargando textos:', error);
      setTextosError(error.message);
      setTextosLoading(false);
      // NO resetear yaCargoTextos para evitar reintentos automáticos
    }
  }, [libroId, token, textosLoading]);

  // Cargar textos cuando el libro esté listo
  useEffect(() => {
    if (libro && !libroLoading && !yaCargoTextos.current) {
      console.log('Libro listo, cargando textos...');
      cargarTextosUnaVez();
    }
  }, [libro, libroLoading, cargarTextosUnaVez]);

  // ===================== FUNCIONES CRUD SIMPLIFICADAS =====================

  const handleAddTexto = useCallback(async (datosTexto) => {
    if (!libroId || !token) throw new Error('Datos insuficientes');
    
    console.log('Creando texto...');
    
    try {
      const textoCreado = await textosAPI.createTexto({
        libroId: parseInt(libroId),
        ...datosTexto
      }, token);
      
      setTextos(prev => [...prev, textoCreado]);
      console.log('Texto creado exitosamente');
    } catch (error) {
      console.error('Error creando texto:', error);
      throw error;
    }
  }, [libroId, token]);

  const handleEditTexto = useCallback(async (datosTexto) => {
    const { id, ...cambios } = datosTexto;
    if (!id || !libroId || !token) throw new Error('Datos insuficientes');
    
    console.log('Editando texto:', id);
    
    try {
      const textoActualizado = await textosAPI.updateTexto(id, datosTexto, token);
      setTextos(prev => prev.map(t => t.id === id ? textoActualizado : t));
      console.log('Texto editado exitosamente');
    } catch (error) {
      console.error('Error editando texto:', error);
      throw error;
    }
  }, [libroId, token]);

  const handleDeleteTexto = useCallback(async (id) => {
    if (!id || !libroId || !token) throw new Error('Datos insuficientes');
    
    console.log('Eliminando texto:', id);
    
    try {
      await textosAPI.deleteTexto(id, token);
      setTextos(prev => prev.filter(t => t.id !== id));
      console.log('Texto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando texto:', error);
      throw error;
    }
  }, [libroId, token]);

  // ===================== HANDLERS DEL VISOR =====================

  const handleDesactivarHerramienta = useCallback(() => {
    setHerramientaActiva("cursor");
  }, []);

  const handlePageChange = useCallback(async (page) => {
    if (page !== paginaActual && page > 0 && page <= totalPaginas) {
      setPaginaActual(page);
      
      // Guardar progreso
      if (libroId && token) {
        try {
          await progresoAPI.guardarProgreso({
            libroId: parseInt(libroId),
            paginaActual: page,
            totalPaginas: totalPaginas,
          }, token);
        } catch (error) {
          console.warn('Error guardando progreso:', error);
        }
      }
    }
  }, [paginaActual, totalPaginas, libroId, token]);

  const handleScaleChange = useCallback((scale) => {
    setVisorInfo(prev => ({ ...prev, scale }));
  }, []);

  const handleModeChange = useCallback((mode) => {
    setVisorInfo(prev => ({ ...prev, mode }));
  }, []);

  const handleTotalPaginasChange = useCallback((total) => {
    setTotalPaginas(total);
    setVisorInfo(prev => ({ ...prev, totalPages: total, pdfListo: true }));
  }, []);

  // ===================== INFORMACIÓN COMPUTADA =====================

  const estadisticas = useMemo(() => ({
    totalTextos: textos.length,
    textosEnPaginaActual: textos.filter(t => t.pagina === paginaActual).length,
  }), [textos, paginaActual]);

  // ===================== RENDER CONDICIONAL SIMPLIFICADO =====================

  // Loading del libro
  if (libroLoading) {
    return (
      <div className="lector-container">
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(33, 150, 243, 0.9)",
          color: "white",
          padding: "20px 30px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          zIndex: 10000,
          textAlign: "center"
        }}>
          <div>Cargando libro...</div>
          <div style={{ fontSize: "12px", marginTop: "8px", opacity: 0.8 }}>
            ID: {libroId}
          </div>
        </div>
      </div>
    );
  }

  // Error del libro
  if (libroError) {
    return (
      <div className="lector-container">
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(244, 67, 54, 0.9)",
          color: "white",
          padding: "20px 30px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          zIndex: 10000,
          textAlign: "center",
          maxWidth: "400px"
        }}>
          <div>Error cargando el libro</div>
          <div style={{ fontSize: "14px", marginTop: "8px", opacity: 0.8 }}>
            {libroError}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Libro no disponible
  if (!libro) {
    return (
      <div className="lector-container">
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255, 152, 0, 0.9)",
          color: "white",
          padding: "20px 30px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          zIndex: 10000,
          textAlign: "center"
        }}>
          <div>Libro no encontrado</div>
          <div style={{ fontSize: "14px", marginTop: "8px", opacity: 0.8 }}>
            ID: {libroId}
          </div>
        </div>
      </div>
    );
  }

  // ===================== RENDER PRINCIPAL =====================

  return (
    <div className="lector-container">
      {/* Panel de herramientas */}
      <PanelHerramientas
        herramientaActiva={herramientaActiva}
        setHerramientaActiva={setHerramientaActiva}
        visorRef={visorRef}
      />

      {/* Contenedor principal */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Layer de textos */}
        <TextosLayer
          ref={textosLayerRef}
          herramientaActiva={herramientaActiva}
          paginaActual={paginaActual}
          visorInfo={visorInfo}
          textos={textos}
          onAddTexto={handleAddTexto}
          onEditTexto={handleEditTexto}
          onDeleteTexto={handleDeleteTexto}
          onDesactivarHerramienta={handleDesactivarHerramienta}
        />

        {/* Visor PDF */}
        <VisorPDF
          ref={visorRef}
          fileUrl={libro?.url || ''}
          herramientaActiva={herramientaActiva}
          onPageChange={handlePageChange}
          paginaInicial={paginaInicial}
          setTotalPaginas={handleTotalPaginasChange}
          onDesactivarHerramienta={handleDesactivarHerramienta}
          onScaleChange={handleScaleChange}
          onModeChange={handleModeChange}
        />
      </div>

      {/* Barra inferior */}
      <BarraInferior
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        visorRef={visorRef}
      />

      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div>Lector v3 | Herramienta: {herramientaActiva}</div>
          <div>Página: {paginaActual}/{totalPaginas} | Escala: {(visorInfo.scale * 100).toFixed(0)}%</div>
          <div>Textos: {estadisticas.totalTextos} total, {estadisticas.textosEnPaginaActual} aquí</div>
          <div>Estados: Libro:{libro ? '✓' : '✗'} TextosLoading:{textosLoading ? '⏳' : '✓'}</div>
          {textosError && (
            <div style={{ color: '#ffcdd2', marginTop: '4px' }}>
              Error: {textosError}
            </div>
          )}
        </div>
      )}

      {/* Indicador de carga de textos */}
      {textosLoading && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          right: '20px',
          background: 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Cargando textos...
        </div>
      )}

      {/* Error de textos */}
      {textosError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#f44336',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          zIndex: 10001,
          maxWidth: '300px'
        }}>
          Error cargando textos: {textosError}
          <button 
            onClick={() => {
              setTextosError(null);
              yaCargoTextos.current = false;
              cargarTextosUnaVez();
            }}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Lector;