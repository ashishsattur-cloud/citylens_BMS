import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CENTER, normalizeReport } from '../lib/format';
const severityColors = { low: '#6c9b76', moderate: '#c3a64e', high: '#d58a4c', critical: '#c45b4d' };

const markerIcon = (color, active = false) => L.divIcon({ className: 'citylens-marker-wrap', html: `<span class="citylens-marker ${active ? 'active' : ''}" style="--marker-color:${color}"></span>`, iconSize: [active ? 22 : 16, active ? 22 : 16], iconAnchor: [active ? 11 : 8, active ? 11 : 8] });

export default function CityMap({ reports = [], activeId, onSelect, onPick, pickedPoint, height = '100%', zoom = 12, className = '' }) {
  const element = useRef(null);
  const map = useRef(null);
  const markerLayer = useRef(null);
  const pickedMarker = useRef(null);
  const markers = useRef(new Map());
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { onPickRef.current = onPick; }, [onPick]);

  useEffect(() => {
    if (!element.current || map.current) return;
    const instance = L.map(element.current, { zoomControl: true, scrollWheelZoom: true }).setView(CENTER, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).addTo(instance);
    markerLayer.current = L.layerGroup().addTo(instance);
    instance.on('click', (event) => onPickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
    map.current = instance;
    const resize = () => instance.invalidateSize();
    setTimeout(resize, 120);
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); instance.remove(); map.current = null; };
  }, [zoom]);

  useEffect(() => {
    if (!markerLayer.current) return;
    markerLayer.current.clearLayers(); markers.current.clear();
    reports.forEach((raw) => {
      const report = normalizeReport(raw);
      if (!Number.isFinite(report.lat) || !Number.isFinite(report.lng)) return;
      const color = severityColors[report.severity?.level] || '#6c9b76';
      const marker = L.marker([report.lat, report.lng], { icon: markerIcon(color, report.id === activeId), title: report.title });
      const popup = document.createElement('div');
      popup.className = 'map-popup';
      const title = document.createElement('strong'); title.textContent = report.title;
      const meta = document.createElement('span'); meta.textContent = `${report.id} · ${report.locality} · ${report.severity?.score ?? '—'}/100`;
      popup.append(title, meta);
      marker.bindPopup(popup).on('click', () => onSelectRef.current?.(report.id));
      marker.addTo(markerLayer.current); markers.current.set(report.id, marker);
    });
    const points = reports.map(normalizeReport).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)).map((r) => [r.lat, r.lng]);
    if (points.length === 1) map.current?.setView(points[0], 15);
    else if (points.length > 1) map.current?.fitBounds(L.latLngBounds(points).pad(0.12), { maxZoom: 13 });
  }, [reports, activeId]);

  useEffect(() => {
    markers.current.forEach((marker, id) => { const raw = reports.find((r) => (r.referenceId || r._id) === id); const level = raw ? normalizeReport(raw).severity?.level : null; marker.setIcon(markerIcon(severityColors[level] || '#6c9b76', id === activeId)); });
  }, [activeId, reports]);

  useEffect(() => {
    if (!map.current) return;
    if (pickedMarker.current) pickedMarker.current.remove();
    if (pickedPoint) {
      pickedMarker.current = L.marker([pickedPoint.lat, pickedPoint.lng], { icon: L.divIcon({ className: '', html: '<span class="picked-marker"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(map.current);
      map.current.setView([pickedPoint.lat, pickedPoint.lng], Math.max(map.current.getZoom(), 15));
    }
  }, [pickedPoint]);

  return <div ref={element} className={`city-map ${className}`} style={{ height }} aria-label="Interactive map of reported civic issues" />;
}
