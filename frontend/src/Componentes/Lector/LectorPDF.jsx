// src/Componentes/Lector/LectorPDF.jsx - VERSION CON ZOOM INICIAL MOVIL
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
 */
const LectorPDF = ({ libroId: libroIdProp }) => {
  const { libroId: libroIdURL } = useParams();
  const navigate = useNavigate();

  // Usar prop si esta disponible, sino usar URL param
  const libroId = libroIdProp || libroIdURL;

  // Referencias de componentes
  const visorRef = useRef(null);
  const anotacionesRef = useRef(null);

  // Estados principales del lector
  const [libro, setLibro] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de navegacion y visualizacion
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  
  // NUEVO: Funcion para determinar zoom inicial segun dispositivo
  const obtenerZoomInicial = useCallback(() => {
    const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window) ||
                   (window.innerWidth <= 768);
    
    return esMovil ? 0.6 : 1.0; // 60% en movil, 100% en desktop
  }, []);

  const [zoom, setZoom] = useState(obtenerZoomInicial);

  // Estados de herramientas y anotaciones
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [anotaciones, setAnotaciones] = useState([]);
  const [anotacionSeleccionada, setAnotacionSeleccionada] = useState(null);
  const [creandoAnotacion, setCreandoAnotacion] = useState(false);

  // Dimensiones del PDF para calculos de coordenadas
  const [dimensionesPDF, setDimensionesPDF] = useState({
    ancho: 0,
    alto: 0,
  });

  // Estado para controlar si ya se cargaron las anotaciones
  const [anotacionesCargadas, setAnotacionesCargadas] = useState(false);

  // NUEVO: Effect para ajustar zoom en cambios de orientacion/resize
  useEffect(() => {
    const manejarResize = () => {
      const nuevoZoomInicial = obtenerZoomInicial();
      // Solo actualizar si cambio de movil a desktop o viceversa
      const esMovilActual = window.innerWidth <= 768;
      const zoomEsMovil = zoom === 0.6;
      const zoomEsDesktop = zoom === 1.0;
      
      if (esMovilActual && zoomEsDesktop) {
        setZoom(0.6);
      } else if (!esMovilActual && zoomEsMovil) {
        setZoom(1.0);
      }
    };

    window.addEventListener('resize', manejarResize);
    window.addEventListener('orientationchange', manejarResize);
    
    return () => {
      window.removeEventListener('resize', manejarResize);
      window.removeEventListener('orientationchange', manejarResize);
    };
  }, [zoom, obtenerZoomInicial]);

  /**
   * Convierte anotacion del formato backend al formato interno
   */
  const convertirAnotacionBackend = useCallback(
    (anotacionBackend) => {
      // Validar que tenga ID valido
      if (!anotacionBackend.id && !anotacionBackend.txt_id) {
        return null;
      }

      // Usar dimensiones por defecto si PDF no esta cargado aun
      const anchoBase = dimensionesPDF.ancho || 595; // A4 estandar
      const altoBase = dimensionesPDF.alto || 842;

      // Obtener datos del backend (puede venir en diferentes formatos)
      const id = anotacionBackend.id || anotacionBackend.txt_id;
      const x = anotacionBackend.x || anotacionBackend.txt_x || 0;
      const y = anotacionBackend.y || anotacionBackend.txt_y || 0;
      const texto =
        anotacionBackend.texto || anotacionBackend.txt_texto || "Texto vacio";
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
        // Convertir coordenadas absolutas a relativas (0-1)
        posicion: {
          x: Math.max(0, Math.min(1, parseFloat(x) / anchoBase)),
          y: Math.max(0, Math.min(1, parseFloat(y) / altoBase)),
        },
        dimensiones: {
          ancho: Math.max(0.1, Math.min(0.8, parseFloat(width) / anchoBase)),
          alto: Math.max(0.05, Math.min(0.5, parseFloat(height) / altoBase)),
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
    } catch (error) {
      setAnotaciones([]);
      setAnotacionesCargadas(true);
      // No es critico, continua sin anotaciones
    }
  }, [libroId, convertirAnotacionBackend]);

  /**
   * Carga inicial del libro y sus datos
   */
  useEffect(() => {
    const cargarLibro = async () => {
      if (!libroId) {
        setError("ID de libro no valido");
        setCargando(false);
        return;
      }

      try {
        setCargando(true);

        // Cargar informacion del libro
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
   * Cargar anotaciones cuando las dimensiones del PDF esten disponibles
   */
  useEffect(() => {
    const debeCagar =
      dimensionesPDF.ancho > 0 &&
      dimensionesPDF.alto > 0 &&
      !anotacionesCargadas &&
      libroId;

    if (debeCagar) {
      cargarAnotaciones();
    }
  }, [dimensionesPDF, anotacionesCargadas, libroId, cargarAnotaciones]);

  /**
   * Convierte anotacion del formato interno al formato backend
   */
  const convertirAnotacionInterno = useCallback(
    (anotacionInterna) => {
      const anchoBase = dimensionesPDF.ancho || 595;
      const altoBase = dimensionesPDF.alto || 842;

      return {
        libroId: parseInt(libroId),
        pagina: anotacionInterna.pagina,
        // Convertir coordenadas relativas a absolutas
        x: Math.round(anotacionInterna.posicion.x * anchoBase),
        y: Math.round(anotacionInterna.posicion.y * altoBase),
        texto: anotacionInterna.contenido.texto,
        width: Math.round(anotacionInterna.dimensiones.ancho * anchoBase),
        height: Math.round(anotacionInterna.dimensiones.alto * altoBase),
        fontSize: anotacionInterna.contenido.fontSize || 14,
      };
    },
    [libroId, dimensionesPDF]
  );

  /**
   * Crea una nueva anotacion de texto
   */
  const crearAnotacion = useCallback(
    async (posicionClick) => {
      if (herramientaActiva !== "texto") return;
      if (!dimensionesPDF.ancho || !dimensionesPDF.alto) {
        return;
      }

      try {
        // Crear anotacion temporal en formato interno
        const nuevaAnotacion = {
          id: `temp_${Date.now()}`, // ID temporal
          tipo: "texto",
          pagina: paginaActual,
          posicion: {
            x: posicionClick.x / (dimensionesPDF.ancho * zoom),
            y: posicionClick.y / (dimensionesPDF.alto * zoom),
          },
          dimensiones: {
            ancho: 200 / (dimensionesPDF.ancho * zoom),
            alto: 60 / (dimensionesPDF.alto * zoom),
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

        // Agregar a la lista local inmediatamente
        setAnotaciones((prev) => [...prev, nuevaAnotacion]);
        setAnotacionSeleccionada(nuevaAnotacion.id);
        setCreandoAnotacion(false);
      } catch (error) {
        setError("Error al crear la anotacion");
      }
    },
    [herramientaActiva, paginaActual, dimensionesPDF, zoom]
  );

  /**
   * Funcion utilitaria para determinar si una anotacion es nueva
   */
  const esAnotacionNueva = useCallback((anotacion) => {
    const tieneIdTemporal =
      typeof anotacion.id === "string" && anotacion.id.startsWith("temp_");
    const marcadaComoNueva = anotacion.metadatos?.esNueva === true;

    return tieneIdTemporal || marcadaComoNueva;
  }, []);

  /**
   * Guarda una anotacion en el backend
   */
  const guardarAnotacion = useCallback(
    async (anotacion) => {
      try {
        if (!anotacion.contenido.texto.trim()) {
          throw new Error("El texto no puede estar vacio");
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
      } catch (error) {
        setError(`Error al guardar: ${error.message}`);
        throw error;
      }
    },
    [convertirAnotacionInterno, convertirAnotacionBackend, esAnotacionNueva]
  );

  /**
   * Elimina una anotacion
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
        setError("Error al eliminar la anotacion");
      }
    },
    [anotaciones, esAnotacionNueva]
  );

  /**
   * Maneja cambios de pagina
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
   * Callback cuando las dimensiones del PDF cambian
   */
  const manejarCambioDimensiones = useCallback((nuevasDimensiones) => {
    setDimensionesPDF((prev) => {
      if (
        prev.ancho !== nuevasDimensiones.ancho ||
        prev.alto !== nuevasDimensiones.alto
      ) {
        return nuevasDimensiones;
      }
      return prev;
    });
  }, []);

  /**
   * Obtiene anotaciones de la pagina actual
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
        {/* Area principal del visor */}
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