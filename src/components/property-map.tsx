import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:9999px 9999px 9999px 0;background:#10b981;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -18],
})

interface PropertyMapProps {
  latitude: number
  longitude: number
  title: string
}

export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      className="z-0 h-[400px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup>
          <span className="font-medium">{title}</span>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
