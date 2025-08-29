// Lector.jsx - PREPARADO PARA BACKEND FastAPI + PostgreSQL
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

//servicios/textosAPI.js
import { textosAPI } from "../../servicios/textosAPI.js";
import { progresoAPI } from "../../servicios/progresoAPI";
import "./lector.css";

export default function Lector() {
  const token = localStorage.getItem("access_token");
  const { libroId } = useParams();

  // ===================== ESTADO PRINCIPAL =====================
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [visorMode, setVisorMode] = useState("single");

  // MODIFICADO: Estado de textos con loading
  const [textos, setTextos] = useState([]);
  const [textosLoading, setTextosLoading] = useState(true);
  const [textosError, setTextosError] = useState(null);
  const visorRef = useRef(null);
  const [libro, setLibro] = useState(null);

  const [paginaInicial, setPaginaInicial] = useState(null);
  const [libroCargado, setLibroCargado] = useState(false);

  useEffect(() => {
    async function cargarLibro() {
      if (!libroId) return;
      try {
        const { data } = await getLibroById(libroId);
        setLibro(data);
      } catch (e) {
        setLibro(null);
      }
    }
    cargarLibro();
  }, [libroId]);

  // CARGAR PAGINA ULTIMA

  useEffect(() => {
    async function cargarLibroYProgreso() {
      if (!libroId) return;
      setLibroCargado(false); // Evita montar visor hasta que todo esté listo
      let pagina = 1;
      try {
        const { data } = await getLibroById(libroId);
        setLibro(data);
        if (token) {
          try {
            const progreso = await progresoAPI.getProgreso(libroId, token);
            if (
              progreso &&
              typeof progreso.pro_pagina_actual === "number" &&
              progreso.pro_pagina_actual > 0
            ) {
              pagina = progreso.pro_pagina_actual;
            }
          } catch {}
        }
        setPaginaInicial(pagina);
        setPaginaActual(pagina); // Para mantener sincronizado tu estado actual
        setLibroCargado(true); // Solo ahora monta el visor
      } catch {
        setLibro(null);
        setPaginaInicial(1);
        setPaginaActual(1);
        setLibroCargado(true);
      }
    }
    cargarLibroYProgreso();
  }, [libroId]);

  // ===================== CARGAR TEXTOS DESDE BACKEND =====================

  const cargarTextos = useCallback(async () => {
    if (!libroId) {
      setTextosLoading(false);
      return;
    }

    try {
      setTextosLoading(true);
      setTextosError(null);

      const textosFromAPI = await textosAPI.getTextos(libroId);

      const textosValidos = textosFromAPI
        .filter(
          (t) =>
            t.txt_id &&
            typeof t.txt_pagina === "number" &&
            typeof t.txt_x === "number" &&
            typeof t.txt_y === "number" &&
            t.txt_texto &&
            typeof t.txt_ancho === "number" &&
            typeof t.txt_alto === "number"
        )
        .map((t) => ({
          id: t.txt_id,
          pagina: t.txt_pagina,
          x: t.txt_x,
          y: t.txt_y,
          texto: t.txt_texto,
          width: t.txt_ancho,
          height: t.txt_alto,
          fontSize: t.txt_dimension,
          createdAt: t.txt_creado,
          updatedAt: t.txt_actualizado,
          usuarioId: t.txt_idusuario,
        }));

      setTextos(textosValidos);
    } catch (error) {
      setTextosError(error.message || "Error cargando textos");

      // FALLBACK: Intentar cargar desde localStorage como respaldo
      try {
        if (localTextos) {
          const datos = JSON.parse(localTextos);
          if (Array.isArray(datos.textos)) {
            setTextos(datos.textos);
          }
        }
      } catch (localError) {
        
      }
    } finally {
      setTextosLoading(false);
    }
  }, [libroId]);

  // Cargar textos al montar componente
  useEffect(() => {
    cargarTextos();
  }, [cargarTextos]);

  // ===================== FUNCIONES CRUD PARA TEXTOS =====================

  const handleAddTexto = useCallback(
    async ({
      pagina,
      x,
      y,
      texto,
      width = 120,
      height = 35,
      fontSize = 14,
    }) => {
      
      // Validaciones
      if (!texto?.trim() || !libroId || !token) {
        return;
      }

      if (typeof pagina !== "number" || pagina < 1 || pagina > totalPaginas) {
        return;
      }

      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        x < 0 ||
        x > 1 ||
        y < 0 ||
        y > 1
      ) {
        
        return;
      }

      // Validar y corregir dimensiones
      const widthValida = Math.max(80, Math.min(400, width));
      const heightValida = Math.max(30, Math.min(300, height));
      const textoLimitado =
        texto.length > 500 ? texto.substring(0, 500) + "..." : texto;

      // MODIFICADO: Preparar datos para API
      const nuevoTextoData = {
        libroId: parseInt(libroId), // NUEVO: Asociar al libro
        pagina,
        x,
        y,
        texto: textoLimitado.trim(),
        width: widthValida,
        height: heightValida,
        fontSize: fontSize || 14, // NUEVO: Incluir fontSize
      };

      try {
        // NUEVO: Crear en backend
        const textoCreado = await textosAPI.createTexto(nuevoTextoData, token);

        // Actualizar estado local con respuesta del servidor
        setTextos((prev) => [...prev, textoCreado]);
        

        // BACKUP: Guardar también en localStorage
        const backupData = {
          textos: [...textos, textoCreado],
          timestamp: Date.now(),
          version: "2.0",
        };
        localStorage.setItem(
          `lector_textos_${libroId}`,
          JSON.stringify(backupData)
        );
      } catch (error) {
        

        // FALLBACK: Crear localmente si falla API
        const textoTemporal = {
          id: `temp_${Date.now()}`, // ID temporal
          ...nuevoTextoData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isTemporary: true, // Marcar como pendiente de sync
        };

        setTextos((prev) => [...prev, textoTemporal]);
        
      }
    },
    [libroId, totalPaginas, textos]
  );

  const handleEditTexto = useCallback(
    async ({ id, texto, x, y, width, height, fontSize }) => {

      if (!id || !libroId || !token) {
        return;
      }

      // Encontrar texto actual
      const textoActual = textos.find((t) => t.id === id);
      if (!textoActual) {
        return;
      }

      // Preparar datos actualizados
      const datosActualizados = { ...textoActual };

      if (texto !== undefined) {
        if (!texto.trim()) {
          return;
        }
        const textoLimitado =
          texto.length > 500 ? texto.substring(0, 500) + "..." : texto;
        datosActualizados.texto = textoLimitado.trim();
      }

      if (x !== undefined && x >= 0 && x <= 1) {
        datosActualizados.x = x;
      }

      if (y !== undefined && y >= 0 && y <= 1) {
        datosActualizados.y = y;
      }

      if (width !== undefined) {
        datosActualizados.width = Math.max(80, Math.min(400, width));
      }

      if (height !== undefined) {
        datosActualizados.height = Math.max(30, Math.min(300, height));
      }

      if (fontSize !== undefined) {
        datosActualizados.fontSize = Math.max(10, Math.min(24, fontSize));
      }

      try {
        // NUEVO: Actualizar en backend
        const textoActualizado = await textosAPI.updateTexto(
          id,
          datosActualizados,
          token
        );

        // Actualizar estado local
        setTextos((prev) =>
          prev.map((t) => (t.id === id ? textoActualizado : t))
        );

        
      } catch (error) {
        
        // FALLBACK: Actualizar localmente
        datosActualizados.updatedAt = new Date().toISOString();
        datosActualizados.isPendingUpdate = true; // Marcar como pendiente

        setTextos((prev) =>
          prev.map((t) => (t.id === id ? datosActualizados : t))
        );

        
      }
    },
    [libroId, textos]
  );

  const handleDeleteTexto = useCallback(
    async (id) => {
      
      if (!id || !libroId || !token) {
        return;
      }

      const textoExistente = textos.find((t) => t.id === id);
      if (!textoExistente) {
        return;
      }

      try {

        await textosAPI.deleteTexto(id, token);
        setTextos((prev) => prev.filter((t) => t.id !== id));
        
      } catch (error) {
    
        setTextos((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, isDeleted: true, deletedAt: new Date().toISOString() }
              : t
          )
        );
      }
    },
    [libroId, textos]
  );

  // ===================== SINCRONIZACIÓN PENDIENTE =====================

  const sincronizarTextosPendientes = useCallback(async () => {
    if (!libroId) return;

    const textosPendientes = textos.filter(
      (t) => t.isTemporary || t.isPendingUpdate || t.isDeleted
    );

    if (textosPendientes.length === 0) return;

    for (const texto of textosPendientes) {
      try {
        if (texto.isTemporary) {
          // Crear en backend
          const { isTemporary, ...textoData } = texto;
          const textoCreado = await textosAPI.createTexto(textoData, token);

          setTextos((prev) =>
            prev.map((t) => (t.id === texto.id ? textoCreado : t))
          );
        } else if (texto.isPendingUpdate) {
          // Actualizar en backend
          const { isPendingUpdate, ...textoData } = texto;
          const textoActualizado = await textosAPI.updateTexto(
            texto.id,
            textoData,
            token
          );

          setTextos((prev) =>
            prev.map((t) => (t.id === texto.id ? textoActualizado : t))
          );
        } else if (texto.isDeleted) {
          // Eliminar en backend
          await textosAPI.deleteTexto(texto.id, token);

          setTextos((prev) => prev.filter((t) => t.id !== texto.id));
        }
      } catch (error) {
        
      }
    }
  }, [textos, libroId]);

  // Sincronizar automáticamente cada 30 segundos
  useEffect(() => {
    const interval = setInterval(sincronizarTextosPendientes, 30000);
    return () => clearInterval(interval);
  }, [sincronizarTextosPendientes]);

  // ===================== RESTO DE FUNCIONES (SIN CAMBIOS) =====================

  const handleDesactivarHerramienta = useCallback(() => {
    setHerramientaActiva("cursor");
  }, [herramientaActiva]);

  const handleVisorModeChange = useCallback((mode) => {
    setVisorMode(mode);
  }, []);

  const handlePageChange = useCallback(
    async (page) => {
      if (page !== paginaActual) {
        setPaginaActual(page);

        // Guardar progreso en backend
        if (libroId && page && totalPaginas && token) {
          try {
            await progresoAPI.guardarProgreso(
              {
                libroId: parseInt(libroId),
                paginaActual: page,
                totalPaginas: totalPaginas,
              },
              token
            );
          } catch (e) {
            
          }
        }
      }
    },
    [paginaActual, libroId, totalPaginas, token]
  );

  const handleScaleChange = useCallback(
    (scale) => {
      if (scale !== pdfScale) {
        setPdfScale(scale);
      }
    },
    [pdfScale]
  );

  // ===================== INFORMACIÓN DEL VISOR =====================

  const visorInfo = useMemo(
    () => ({
      mode: visorMode,
      scale: pdfScale,
      totalPages: totalPaginas,
      currentPage: paginaActual,
    }),
    [visorMode, pdfScale, totalPaginas, paginaActual]
  );

  // ===================== ESTADÍSTICAS COMPUTADAS =====================

  const estadisticas = useMemo(() => {
    const textosEnPaginaActual = textos.filter(
      (t) => t.pagina === paginaActual
    ).length;
    const textosPendientes = textos.filter(
      (t) => t.isTemporary || t.isPendingUpdate || t.isDeleted
    ).length;

    return {
      totalTextos: textos.length,
      textosEnPaginaActual,
      textosPendientes,
      paginasConTextos: new Set(textos.map((t) => t.pagina)).size,
      promedioTextosPorPagina:
        totalPaginas > 0 ? (textos.length / totalPaginas).toFixed(1) : 0,
    };
  }, [textos, paginaActual, totalPaginas]);

  // ===================== LIMPIEZA DE DATOS HUÉRFANOS =====================

  useEffect(() => {
    if (totalPaginas > 0) {
      const textosValidos = textos.filter((t) => t.pagina <= totalPaginas);
      if (textosValidos.length !== textos.length) {
        setTextos(textosValidos);
      }
    }
  }, [totalPaginas, textos]);

  // ===================== FUNCIÓN DE EXPORTACIÓN =====================

  const exportarTextos = useCallback(async () => {
    if (!token || !libroId) return null;

    try {
      const textosExportados = await textosAPI.exportTextos(libroId, token);

      return textosExportados;
    } catch (error) {

      return {
        textos,
        metadata: {
          libroId,
          totalPaginas,
          pdfScale,
          visorMode,
          exportedAt: new Date().toISOString(),
          version: "2.0",
        },
      };
    }
  }, [textos, libroId, totalPaginas, pdfScale, visorMode]);

  // ===================== RENDER =====================

  // Mostrar loading mientras cargan los textos
  if (!libro || textosLoading|| !libroCargado || paginaInicial === null) {
    return (
      <div className="lector-container">
        <div
          style={{
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
          }}
        ></div>
      </div>
    );
  }

 


  return (
    <div className="lector-container">
      {/* RESTO DEL COMPONENTE SIN CAMBIOS */}
      <PanelHerramientas
        herramientaActiva={herramientaActiva}
        setHerramientaActiva={setHerramientaActiva}
        visorRef={visorRef}
      />

      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <TextosLayer
          herramientaActiva={herramientaActiva}
          onPageChange={handlePageChange}
          visorInfo={visorInfo}
          textos={textos}
          onAddTexto={handleAddTexto}
          onEditTexto={handleEditTexto}
          onDeleteTexto={handleDeleteTexto}
          onDesactivarHerramienta={handleDesactivarHerramienta}
        />

        <VisorPDF
          ref={visorRef}
          fileUrl={libro.url}
          herramientaActiva={herramientaActiva}
          onPageChange={handlePageChange}
          paginaInicial={paginaInicial}
          setTotalPaginas={setTotalPaginas}
          onDesactivarHerramienta={handleDesactivarHerramienta}
          onScaleChange={handleScaleChange}
          onModeChange={handleVisorModeChange}
        />
      </div>

      <BarraInferior
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        visorRef={visorRef}
      />
    </div>
  );
}
