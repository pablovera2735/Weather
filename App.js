import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

const API_KEY = process.env.REACT_APP_WEATHER_KEY;

const WEATHER_ICONS = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
};

const CIUDADES = [
  'Málaga', 'Cordoba', 'Granada', 'Almeria', 'Sevilla', 'Cadiz',
  'Madrid', 'Barcelona', 'Valencia', 'Zaragoza', 'Toledo'
];

export default function App() {
  const [ciudad, setCiudad] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [clima, setClima] = useState(null);
  const [pronostico, setPronostico] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState(() => {
    const saved = localStorage.getItem('historial');
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (ciudad.trim().length >= 2) {
      const filtradas = CIUDADES.filter(c =>
        c.toLowerCase().includes(ciudad.toLowerCase())
      );
      setSugerencias(filtradas.slice(0, 5));
    } else {
      setSugerencias([]);
    }
  }, [ciudad]);

async function buscarClima(nombreCiudad) {
  const buscar = nombreCiudad ? nombreCiudad : ciudad;
  if (!buscar.trim()) return;
  setCargando(true);
  setError('');
  setClima(null);
  setSugerencias([]);
  setCiudad(buscar);

    try {
      const resClima = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${buscar}&appid=${API_KEY}&units=metric&lang=es`
      );

      if (!resClima.ok) {
        setError('Ciudad no encontrada. Verificá el nombre e intentá de nuevo.');
        setCargando(false);
        return;
      }

      const dataClima = await resClima.json();

      const resPron = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${buscar}&appid=${API_KEY}&units=metric&lang=es`
      );
      const dataPron = await resPron.json();

      const diasUnicos = {};
      dataPron.list.forEach(item => {
        const fecha = new Date(item.dt * 1000);
        const dia = fecha.toLocaleDateString('es-ES', { weekday:'short', day:'numeric' });
        if (!diasUnicos[dia]) diasUnicos[dia] = item;
      });

      const proxDias = Object.values(diasUnicos).slice(1, 6);

      setClima(dataClima);
      setPronostico(proxDias);
      setCiudad(buscar);

      const nuevoHistorial = [buscar, ...historial.filter(h => h.toLowerCase() !== buscar.toLowerCase())].slice(0, 5);
      setHistorial(nuevoHistorial);
      localStorage.setItem('historial', JSON.stringify(nuevoHistorial));

    } catch (e) {
      setError('Error al conectarse. Intentá de nuevo.');
    }

    setCargando(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') buscarClima();
  }

  function limpiarHistorial() {
    setHistorial([]);
    localStorage.removeItem('historial');
  }

  const getBackground = () => {
    if (!clima) return 'linear-gradient(135deg, #1a1a2e, #16213e)';
    const main = clima.weather[0].main;
    const hora = new Date().getHours();
    const esNoche = hora < 6 || hora > 20;
    if (esNoche) return 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
    if (main === 'Clear') return 'linear-gradient(135deg, #f7971e, #ffd200)';
    if (main === 'Rain' || main === 'Drizzle') return 'linear-gradient(135deg, #373b44, #4286f4)';
    if (main === 'Thunderstorm') return 'linear-gradient(135deg, #0f0c29, #302b63)';
    if (main === 'Snow') return 'linear-gradient(135deg, #e0eafc, #cfdef3)';
    if (main === 'Clouds') return 'linear-gradient(135deg, #606c88, #3f4c6b)';
    return 'linear-gradient(135deg, #1a1a2e, #16213e)';
  };

  return (
    <div className="app" style={{ background: getBackground() }}>
      <div className="container">

        <h1 className="titulo">WeatherApp</h1>
        <p className="subtitulo">Consultá el clima de cualquier ciudad</p>

        {/* Buscador */}
        <div className="buscador-wrapper">
          <div className="buscador">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar ciudad..."
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input"
              autoComplete="off"
            />
            <button onClick={() => buscarClima()} className="btn-buscar" disabled={cargando}>
              {cargando ? '...' : '🔍'}
            </button>
          </div>

          {/* Sugerencias */}
          {sugerencias.length > 0 && (
            <div className="sugerencias">
              {sugerencias.map((s, i) => (
                <div key={i} className="sugerencia-item" onClick={() => { setCiudad(s); buscarClima(s); }}>
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {cargando && <p className="cargando">Buscando...</p>}

        {/* Historial */}
        {!clima && historial.length > 0 && (
          <div className="historial">
            <div className="historial-header">
              <span className="historial-titulo">Búsquedas recientes</span>
              <button className="btn-limpiar" onClick={limpiarHistorial}>Limpiar</button>
            </div>
            <div className="historial-lista">
              {historial.map((h, i) => (
                <div key={i} className="historial-item" onClick={() => { setCiudad(h); buscarClima(h); }}>
                  🕐 {h}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clima actual */}
        {clima && (
          <>
            <div className="card-clima">
              <div className="clima-header">
                <div>
                  <h2 className="ciudad-nombre">{clima.name}, {clima.sys.country}</h2>
                  <p className="descripcion">{clima.weather[0].description}</p>
                </div>
                <span className="icono-clima">{WEATHER_ICONS[clima.weather[0].main] || '🌡️'}</span>
              </div>

              <div className="temperatura-principal">{Math.round(clima.main.temp)}°C</div>
              <p className="sensacion">Sensación térmica: {Math.round(clima.main.feels_like)}°C</p>

              <div className="detalles-grid">
                <div className="detalle">
                  <span className="detalle-icono">💧</span>
                  <span className="detalle-label">Humedad</span>
                  <span className="detalle-valor">{clima.main.humidity}%</span>
                </div>
                <div className="detalle">
                  <span className="detalle-icono">🌬️</span>
                  <span className="detalle-label">Viento</span>
                  <span className="detalle-valor">{Math.round(clima.wind.speed * 3.6)} km/h</span>
                </div>
                <div className="detalle">
                  <span className="detalle-icono">👁️</span>
                  <span className="detalle-label">Visibilidad</span>
                  <span className="detalle-valor">{(clima.visibility / 1000).toFixed(1)} km</span>
                </div>
                <div className="detalle">
                  <span className="detalle-icono">🌡️</span>
                  <span className="detalle-label">Mín / Máx</span>
                  <span className="detalle-valor">{Math.round(clima.main.temp_min)}° / {Math.round(clima.main.temp_max)}°</span>
                </div>
              </div>

              {/* Botón descargar */}
              <button className="btn-descargar" onClick={() => descargarClima(clima, pronostico)}>
                ⬇️ Descargar resumen
              </button>
            </div>

            {/* Pronóstico 5 días */}
            {pronostico.length > 0 && (
              <div className="pronostico">
                <h3 className="pronostico-titulo">Próximos 5 días</h3>
                <div className="pronostico-grid">
                  {pronostico.map((dia, i) => {
                    const fecha = new Date(dia.dt * 1000);
                    const nombreDia = fecha.toLocaleDateString('es-ES', { weekday:'short', day:'numeric' });
                    return (
                      <div key={i} className="pronostico-card">
                        <span className="pron-dia">{nombreDia}</span>
                        <span className="pron-icono">{WEATHER_ICONS[dia.weather[0].main] || '🌡️'}</span>
                        <span className="pron-temp">{Math.round(dia.main.temp)}°C</span>
                        <span className="pron-desc">{dia.weather[0].description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="btn-volver" onClick={() => { setClima(null); setPronostico([]); setCiudad(''); }}>
              ← Nueva búsqueda
            </button>
          </>
        )}

        <p className="footer">Desarrollado por Pablo Vera García</p>
      </div>
    </div>
  );
}

function descargarClima(clima, pronostico) {
  const fecha = new Date().toLocaleDateString('es-ES');
  const hora = new Date().toLocaleTimeString('es-ES');

  let texto = `RESUMEN DEL CLIMA - ${fecha} ${hora}\n`;
  texto += `${'='.repeat(40)}\n\n`;
  texto += `Ciudad: ${clima.name}, ${clima.sys.country}\n`;
  texto += `Temperatura: ${Math.round(clima.main.temp)}°C\n`;
  texto += `Sensación térmica: ${Math.round(clima.main.feels_like)}°C\n`;
  texto += `Descripción: ${clima.weather[0].description}\n`;
  texto += `Humedad: ${clima.main.humidity}%\n`;
  texto += `Viento: ${Math.round(clima.wind.speed * 3.6)} km/h\n`;
  texto += `Visibilidad: ${(clima.visibility / 1000).toFixed(1)} km\n`;
  texto += `Mín / Máx: ${Math.round(clima.main.temp_min)}° / ${Math.round(clima.main.temp_max)}°\n\n`;

  if (pronostico.length > 0) {
    texto += `PRONÓSTICO PRÓXIMOS DÍAS\n`;
    texto += `${'='.repeat(40)}\n`;
    pronostico.forEach(dia => {
      const fecha = new Date(dia.dt * 1000).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
      texto += `${fecha}: ${Math.round(dia.main.temp)}°C - ${dia.weather[0].description}\n`;
    });
  }

  texto += `\nGenerado por WeatherApp - Pablo Vera García`;

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clima-${clima.name}-${fecha.replace(/\//g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
