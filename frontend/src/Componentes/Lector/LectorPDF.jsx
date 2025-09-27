// src/Componentes/Lector/LectorPDF.jsx - VERSIÓN CORREGIDA CON COORDENADAS UNIFICADAS
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario";
import VisorPDF from "./VisorPDF";
import CapaAnotaciones from "./CapaAnotaciones";
import PanelHerramientas from "./PanelHerramientas";
import BarraInferior from "./BarraInferior";
import { textosAPI } from "../../servicios/textosAPI";
import { getLibroById } from "../../servicios/libros";
import "./lector.css";

/**
 * Componente principal del lector de PDF con sistema de anotaciones
 * CORREGIDO: Coordenadas consistentes entre móvil y desktop
 */
const LectorPDF = ({ libroId: libroIdProp }) => {
  const { libroId: libroIdURL } = useParams();
  const navigate = useNavigate();

  // Usar prop si está disponible, sino usar URL param
  const libroId = libroIdProp || libroIdURL;

  // Referencias de componentes
  const visorRef = useRef(null);
  const anotacionesRef = useRef(null);

  // Estados principales del lector
  const [libro, setLibro] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de navegación y visualización
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  // Estados de herramientas y anotaciones
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [anotaciones, setAnotaciones] = useState([]);
  const [anotacionSeleccionada, setAnotacionSeleccionada] = useState(null);
  const [creandoAnotacion, setCreandoAnotacion] = useState(false);

  // NUEVO: Dimensiones base del PDF para coordenadas consistentes
  const [dimensionesPDF, setDimensionesPDF] = useState({
    ancho: 0,
    alto: 0,
  });

  // Estado para controlar si ya se cargaron las anotaciones
  const [anotacionesCargadas, setAnotacionesCargadas] = useState(false);

  /**
   * CORREGIDO: Convierte anotación del formato backend al formato interno
   * NUEVO: Usa dimensiones base consistentes
   */
  const convertirAnotacionBackend = useCallback(
    (anotacionBackend) => {
      // Validar que tenga ID válido
      if (!anotacionBackend.id && !anotacionBackend.txt_id) {
        return null;
      }

      // CORREGIDO: Usar dimensiones base del PDF real (no valores por defecto)
      const anchoBase = dimensionesPDF.ancho || 595;
      const altoBase = dimensionesPDF.alto || 842;

      // Obtener datos del backend (puede venir en diferentes formatos)
      const id = anotacionBackend.id || anotacionBackend.txt_id;
      const x = anotacionBackend.x || anotacionBackend.txt_x || 0;
      const y = anotacionBackend.y || anotacionBackend.txt_y || 0;
      const texto =
        anotacionBackend.texto || anotacionBackend.txt_texto || "Texto vacío";
      const width = anotacionBackend.width || anotacionBackend.txt_ancho || 200;
      const height = anotacionBackend.height || anotacionBackend.txt_alto || 60;
      const fontSize =
        anotacionBackend.fontSize || anotacionBackend.txt_dimension || 14;
      const pagina =
        anotacionBackend.pagina || anotacionBackend.txt_pagina || 1;

      return {
        id: id,
        tipo: "texto",
        pagina: parseInt(pagina),
        // NUEVO: Asegurar que las coordenadas estén normalizadas correctamente
        posicion: {
          x: Math.max(0, Math.min(1, parseFloat(x) / anchoBase)),
          y: Math.max(0, Math.min(1, parseFloat(y) / altoBase)),
        },
        dimensiones: {
          ancho: Math.max(0.05, Math.min(0.9, parseFloat(width) / anchoBase)),
          alto: Math.max(0.02, Math.min(0.8, parseFloat(height) / altoBase)),
        },
        contenido: {
          texto: texto,
          fontSize: parseInt(fontSize),
          color: "#000000",
        },
        metadatos: {
          creado: anotacionBackend.createdAt || anotacionBackend.txt_creado,
          modificado:
            anotacionBackend.updatedAt || anotacionBackend.txt_actualizado,
          usuarioId:
            anotacionBackend.usuarioId || anotacionBackend.txt_idusuario,
          esNueva: false, // Importante: las del backend NO son nuevas
        },
      };
    },
    [dimensionesPDF]
  );

  /**
   * Carga las anotaciones existentes del libro
   */
  const cargarAnotaciones = useCallback(async () => {
    if (!libroId) {
      return;
    }

    try {
      setAnotacionesCargadas(false);
      const anotacionesData = await textosAPI.getTextos(libroId);

      if (!Array.isArray(anotacionesData)) {
        setAnotaciones([]);
        setAnotacionesCargadas(true);
        return;
      }

      // Convertir formato backend a formato interno
      const anotacionesConvertidas = anotacionesData
        .map((anotacion) => convertirAnotacionBackend(anotacion))
        .filter((anotacion) => anotacion !== null);

      setAnotaciones(anotacionesConvertidas);
      setAnotacionesCargadas(true);
      
      // NUEVO: Debug de coordenadas cargadas
      if (process.env.NODE_ENV === 'development' && anotacionesConvertidas.length > 0) {
        console.group('🔄 Anotaciones cargadas del backend');
        console.log('Dimensiones PDF base:', dimensionesPDF);
        console.log('Anotaciones convertidas:', anotacionesConvertidas.length);
        anotacionesConvertidas.forEach((anotacion, index) => {
          console.log(`Anotación ${index + 1}:`, {
            id: anotacion.id,
            posicionRelativa: anotacion.posicion,
            dimensionesRelativas: anotacion.dimensiones,
            texto: anotacion.contenido.texto.substring(0, 30) + '...'
          });
        });
        console.groupEnd();
      }
    } catch (error) {
      setAnotaciones([]);
      setAnotacionesCargadas(true);
      // No es crítico, continúa sin anotaciones
    }
  }, [libroId, convertirAnotacionBackend, dimensionesPDF]);

  /**
   * Carga inicial del libro y sus datos
   */
  useEffect(() => {
    const cargarLibro = async () => {
      if (!libroId) {
        setError("ID de libro no válido");
        setCargando(false);
        return;
      }

      try {
        setCargando(true);

        // Cargar información del libro
        const { data: libroData } = await getLibroById(libroId);
        setLibro(libroData);

        if (libroData.url) {
          setPdfUrl(libroData.url);
        }
      } catch (err) {
        setError("Error al cargar el libro. Verifica que tengas acceso.");
      } finally {
        setCargando(false);
      }
    };

    cargarLibro();
  }, [libroId]);

  /**
   * CORREGIDO: Cargar anotaciones cuando las dimensiones del PDF estén disponibles
   */
  useEffect(() => {
    const debeCagar =
      dimensionesPDF.ancho > 0 &&
      dimensionesPDF.alto > 0 &&
      !anotacionesCargadas &&
      libroId;

    if (debeCagar) {
      console.log('📏 Dimensiones PDF disponibles, cargando anotaciones...', dimensionesPDF);
      cargarAnotaciones();
    }
  }, [dimensionesPDF, anotacionesCargadas, libroId, cargarAnotaciones]);

  /**
   * CORREGIDO: Convierte anotación del formato interno al formato backend
   * NUEVO: Usa dimensiones base consistentes
   */
  const convertirAnotacionInterno = useCallback(
    (anotacionInterna) => {
      // CORREGIDO: Usar dimensiones base reales del PDF
      const anchoBase = dimensionesPDF.ancho || 595;
      const altoBase = dimensionesPDF.alto || 842;

      const datosBackend = {
        libroId: parseInt(libroId),
        pagina: anotacionInterna.pagina,
        // NUEVO: Convertir coordenadas relativas a absolutas usando dimensiones base
        x: Math.round(anotacionInterna.posicion.x * anchoBase),
        y: Math.round(anotacionInterna.posicion.y * altoBase),
        texto: anotacionInterna.contenido.texto,
        width: Math.round(anotacionInterna.dimensiones.ancho * anchoBase),
        height: Math.round(anotacionInterna.dimensiones.alto * altoBase),
        fontSize: anotacionInterna.contenido.fontSize || 14,
      };

      // NUEVO: Debug de conversión
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Convirtiendo anotación para backend:', {
          posicionRelativa: anotacionInterna.posicion,
          posicionAbsoluta: { x: datosBackend.x, y: datosBackend.y },
          dimensionesBase: { ancho: anchoBase, alto: altoBase },
          dimensionesRelativas: anotacionInterna.dimensiones,
          dimensionesAbsolutas: { width: datosBackend.width, height: datosBackend.height }
        });
      }

      return datosBackend;
    },
    [libroId, dimensionesPDF]
  );

  /**
   * CORREGIDO: Crea una nueva anotación de texto
   * NUEVO: Usa dimensiones base consistentes
   */
  const crearAnotacion = useCallback(
    async (posicionClick) => {
      if (herramientaActiva !== "texto") return;
      if (!dimensionesPDF.ancho || !dimensionesPDF.alto) {
        return;
      }

      try {
        // CORREGIDO: Usar dimensiones base del PDF para cálculo consistente
        const dimensionesBase = dimensionesPDF;
        
        const nuevaAnotacion = {
          id: `temp_${Date.now()}`, // ID temporal
          tipo: "texto",
          pagina: paginaActual,
          posicion: {
            // NUEVO: Calcular coordenadas relativas usando dimensiones base
            x: posicionClick.x / (dimensionesBase.ancho * zoom),
            y: posicionClick.y / (dimensionesBase.alto * zoom),
          },
          dimensiones: {
            // NUEVO: Dimensiones relativas basadas en dimensiones base
            ancho: 200 / dimensionesBase.ancho,
            alto: 60 / dimensionesBase.alto,
          },
          contenido: {
            texto: "Nuevo texto",
            fontSize: 14,
            color: "#000000",
          },
          metadatos: {
            creado: new Date().toISOString(),
            esNueva: true,
            editando: true,
          },
        };

        // NUEVO: Debug de creación
        if (process.env.NODE_ENV === 'development') {
          console.log('✨ Creando nueva anotación:', {
            posicionClick: posicionClick,
            dimensionesBase: dimensionesBase,
            zoom: zoom,
            posicionRelativa: nuevaAnotacion.posicion,
            dimensionesRelativas: nuevaAnotacion.dimensiones
          });
        }

        // Agregar a la lista local inmediatamente
        setAnotaciones((prev) => [...prev, nuevaAnotacion]);
        setAnotacionSeleccionada(nuevaAnotacion.id);
        setCreandoAnotacion(false);
      } catch (error) {
        setError("Error al crear la anotación");
      }
    },
    [herramientaActiva, paginaActual, dimensionesPDF, zoom]
  );

  /**
   * Función utilitaria para determinar si una anotación es nueva
   */
  const esAnotacionNueva = useCallback((anotacion) => {
    const tieneIdTemporal =
      typeof anotacion.id === "string" && anotacion.id.startsWith("temp_");
    const marcadaComoNueva = anotacion.metadatos?.esNueva === true;

    return tieneIdTemporal || marcadaComoNueva;
  }, []);

  /**
   * Guarda una anotación en el backend
   */
  const guardarAnotacion = useCallback(
    async (anotacion) => {
      try {
        if (!anotacion.contenido.texto.trim()) {
          throw new Error("El texto no puede estar vacío");
        }

        const datosBackend = convertirAnotacionInterno(anotacion);
        const esNueva = esAnotacionNueva(anotacion);

        let anotacionGuardada;

        if (esNueva) {
          anotacionGuardada = await textosAPI.createTexto(datosBackend);
        } else {
          anotacionGuardada = await textosAPI.updateTexto(
            anotacion.id,
            datosBackend
          );
        }

        // Actualizar en la lista local con el ID real del backend
        const anotacionConvertida =
          convertirAnotacionBackend(anotacionGuardada);
        setAnotaciones((prev) =>
          prev.map((a) => (a.id === anotacion.id ? anotacionConvertida : a))
        );

        // NUEVO: Debug de guardado
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 Anotación guardada:', {
            esNueva: esNueva,
            datosBackend: datosBackend,
            anotacionConvertida: anotacionConvertida
          });
        }
      } catch (error) {
        setError(`Error al guardar: ${error.message}`);
        throw error;
      }
    },
    [convertirAnotacionInterno, convertirAnotacionBackend, esAnotacionNueva]
  );

  /**
   * Elimina una anotación
   */
  const eliminarAnotacion = useCallback(
    async (idAnotacion) => {
      try {
        const anotacion = anotaciones.find((a) => a.id === idAnotacion);

        if (anotacion && !esAnotacionNueva(anotacion)) {
          await textosAPI.deleteTexto(anotacion.id);
        }

        // Remover de la lista local
        setAnotaciones((prev) => prev.filter((a) => a.id !== idAnotacion));
        setAnotacionSeleccionada(null);
      } catch (error) {
        setError("Error al eliminar la anotación");
      }
    },
    [anotaciones, esAnotacionNueva]
  );

  /**
   * Maneja cambios de página
   */
  const cambiarPagina = useCallback(
    (nuevaPagina) => {
      if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        setPaginaActual(nuevaPagina);
        setAnotacionSeleccionada(null);
      }
    },
    [totalPaginas]
  );

  /**
   * Maneja cambios de zoom
   */
  const cambiarZoom = useCallback((nuevoZoom) => {
    const zoomLimitado = Math.min(Math.max(nuevoZoom, 0.25), 4);
    setZoom(zoomLimitado);
  }, []);

  /**
   * NUEVO: Callback cuando las dimensiones del PDF cambian
   * CRÍTICO: Estas son las dimensiones base para coordenadas consistentes
   */
  const manejarCambioDimensiones = useCallback((nuevasDimensiones) => {
    setDimensionesPDF((prev) => {
      if (
        prev.ancho !== nuevasDimensiones.ancho ||
        prev.alto !== nuevasDimensiones.alto
      ) {
        console.log('📏 Dimensiones PDF actualizadas:', nuevasDimensiones);
        return nuevasDimensiones;
      }
      return prev;
    });
  }, []);

  /**
   * NUEVO: Función de debug para coordenadas (opcional)
   */
  const debugCoordenadas = useCallback((anotacion, evento = 'debug') => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🎯 Debug Coordenadas - ${evento}`);
      console.log('Dimensiones PDF base:', dimensionesPDF);
      console.log('Zoom actual:', zoom);
      console.log('Posición relativa:', anotacion.posicion);
      console.log('Dimensiones relativas:', anotacion.dimensiones);
      
      // Calcular píxeles para verificación
      const pixeles = {
        x: anotacion.posicion.x * dimensionesPDF.ancho * zoom,
        y: anotacion.posicion.y * dimensionesPDF.alto * zoom
      };
      console.log('Posición en píxeles:', pixeles);
      
      // Calcular coordenadas absolutas para backend
      const absolutas = {
        x: Math.round(anotacion.posicion.x * dimensionesPDF.ancho),
        y: Math.round(anotacion.posicion.y * dimensionesPDF.alto)
      };
      console.log('Coordenadas absolutas (backend):', absolutas);
      console.groupEnd();
    }
  }, [dimensionesPDF, zoom]);

  /**
   * Obtiene anotaciones de la página actual
   */
  const anotacionesPaginaActual = anotaciones.filter(
    (anotacion) => anotacion.pagina === paginaActual
  );

  // Renderizado de estados de carga y error
  if (cargando) {
    return (
      <LayoutUsuario activeKey="biblioteca">
        <div className="lector-cargando">
          <div className="spinner"></div>
          <p>Cargando libro...</p>
        </div>
      </LayoutUsuario>
    );
  }

  if (error) {
    return (
      <LayoutUsuario activeKey="biblioteca">
        <div className="lector-error">
          <h3>Error al cargar el libro</h3>
          <p>{error}</p>
          <button onClick={() => navigate("/biblioteca")}>
            Volver a la biblioteca
          </button>
          <button onClick={() => setError(null)} style={{ marginLeft: "1rem" }}>
            Reintentar
          </button>
        </div>
      </LayoutUsuario>
    );
  }

  return (
    <LayoutUsuario activeKey="biblioteca">
      <div className="lector-pdf">
        {/* Área principal del visor */}
        <div className="visor-container">
          <div className="visor-pdf-wrapper" style={{ position: "relative" }}>
            <VisorPDF
              ref={visorRef}
              pdfUrl={pdfUrl}
              paginaActual={paginaActual}
              zoom={zoom}
              onPaginaCambiada={setPaginaActual}
              onTotalPaginas={setTotalPaginas}
              onDimensionesCambiadas={manejarCambioDimensiones}
            />

            {/* Capa de anotaciones superpuesta */}
            {dimensionesPDF.ancho > 0 && dimensionesPDF.alto > 0 && (
              <CapaAnotaciones
                ref={anotacionesRef}
                anotaciones={anotacionesPaginaActual}
                anotacionSeleccionada={anotacionSeleccionada}
                herramientaActiva={herramientaActiva}
                zoom={zoom}
                dimensionesPDF={dimensionesPDF}
                onCrearAnotacion={crearAnotacion}
                onSeleccionarAnotacion={setAnotacionSeleccionada}
                onGuardarAnotacion={guardarAnotacion}
                onEliminarAnotacion={eliminarAnotacion}
              />
            )}
          </div>
        </div>

        {/* Panel de herramientas lateral */}
        <PanelHerramientas
          herramientaActiva={herramientaActiva}
          setHerramientaActiva={setHerramientaActiva}
          visorRef={visorRef}
        />

        {/* Barra de controles inferior */}
        <BarraInferior
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          zoom={zoom}
          visorRef={visorRef}
          onCambiarPagina={cambiarPagina}
          onCambiarZoom={cambiarZoom}
        />
      </div>
    </LayoutUsuario>
  );
};

export default LectorPDF;