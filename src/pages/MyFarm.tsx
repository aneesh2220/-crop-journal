import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, MapPin, Ruler, Droplets, Trash2, Edit2, Sprout, Crosshair, Satellite } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, NotConnectedState, LoadingState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useFarms } from '@/hooks/useFarms'
import { useCrops } from '@/hooks/useCrops'
import type { Farm, Crop } from '@/lib/database.types'

export default function MyFarm() {
  const { t } = useTranslation()
  const { configured } = useAuth()
  const { farms, loading, addFarm, updateFarm, deleteFarm } = useFarms()
  const { crops, addCrop, deleteCrop } = useCrops()

  const [farmModal, setFarmModal] = useState<{ open: boolean; farm?: Farm }>({ open: false })
  const [cropModal, setCropModal] = useState<{ open: boolean; farmId?: string }>({ open: false })

  if (!configured) {
    return (
      <div>
        <PageHeader title={t('myFarm.title')} />
        <NotConnectedState />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('myFarm.title')}
        action={
          <Button onClick={() => setFarmModal({ open: true })} icon={<Plus size={16} />}>
            {t('myFarm.addFarm')}
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : farms.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sprout className="text-[var(--text-muted)]" size={22} />}
            title={t('dashboard.noFarmYet')}
            action={<Button onClick={() => setFarmModal({ open: true })}>{t('dashboard.addFirstFarm')}</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {farms.map((farm) => {
            const farmCrops = crops.filter((c) => c.farm_id === farm.id)
            return (
              <Card key={farm.id}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)]">{farm.name}</h3>
                    {farm.location_name && (
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--text-muted)]">
                        <MapPin size={13} /> {farm.location_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setFarmModal({ open: true, farm })} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]">
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => deleteFarm(farm.id)}
                      className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {farm.land_size && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">
                      <Ruler size={12} /> {farm.land_size} {farm.land_unit}
                    </span>
                  )}
                  {farm.soil_type && (
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">{farm.soil_type}</span>
                  )}
                  {farm.irrigation_type && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">
                      <Droplets size={12} /> {farm.irrigation_type}
                    </span>
                  )}
                  {farm.location_lat != null && farm.location_lng != null && (
                    <Link
                      to="/field-view"
                      className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300"
                    >
                      <Satellite size={12} /> {t('fieldView.viewFromSatellite')}
                    </Link>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)]">
                    {t('myFarm.crops')} ({farmCrops.length})
                  </h4>
                  <button
                    onClick={() => setCropModal({ open: true, farmId: farm.id })}
                    className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                  >
                    <Plus size={14} /> {t('common.add')}
                  </button>
                </div>
                {farmCrops.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {farmCrops.map((crop) => (
                      <span
                        key={crop.id}
                        className="group flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                      >
                        {crop.name}
                        <button onClick={() => deleteCrop(crop.id)} className="text-brand-400 hover:text-red-500">
                          <Trash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <FarmFormModal
        state={farmModal}
        onClose={() => setFarmModal({ open: false })}
        onSave={async (data) => {
          if (farmModal.farm) await updateFarm(farmModal.farm.id, data)
          else await addFarm(data)
          setFarmModal({ open: false })
        }}
      />
      <CropFormModal
        open={cropModal.open}
        onClose={() => setCropModal({ open: false })}
        onSave={async (data) => {
          if (cropModal.farmId) {
            await addCrop({ ...data, farm_id: cropModal.farmId })
          }
          setCropModal({ open: false })
        }}
      />
    </div>
  )
}

function FarmFormModal({
  state,
  onClose,
  onSave,
}: {
  state: { open: boolean; farm?: Farm }
  onClose: () => void
  onSave: (data: Partial<Farm> & { name: string }) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(state.farm?.name ?? '')
  const [location, setLocation] = useState(state.farm?.location_name ?? '')
  const [landSize, setLandSize] = useState(state.farm?.land_size?.toString() ?? '')
  const [soilType, setSoilType] = useState(state.farm?.soil_type ?? '')
  const [irrigationType, setIrrigationType] = useState(state.farm?.irrigation_type ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    state.farm?.location_lat != null && state.farm?.location_lng != null
      ? { lat: state.farm.location_lat, lng: state.farm.location_lng }
      : null
  )
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Pinning the farm's coordinates is what makes it selectable on the satellite Field View —
  // the text location name alone can't be put on a map.
  const pinLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t('fieldView.geoUnsupported'))
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        setGeoError(err.message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 }
    )
  }

  return (
    <Modal open={state.open} onClose={onClose} title={state.farm ? t('myFarm.editFarm') : t('myFarm.addFarm')}>
      <div className="space-y-4">
        <Input label={t('myFarm.farmName')} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('myFarm.location')} value={location} onChange={(e) => setLocation(e.target.value)} />

        <div>
          <Button variant="outline" size="sm" onClick={pinLocation} loading={locating} icon={<Crosshair size={15} />}>
            {coords ? t('myFarm.updatePin') : t('myFarm.pinLocation')}
          </Button>
          {coords && (
            <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          )}
          {geoError && <p className="mt-2 text-xs text-amber-600">{geoError}</p>}
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t('myFarm.pinHelp')}</p>
        </div>

        <Input label={t('myFarm.landSize')} type="number" value={landSize} onChange={(e) => setLandSize(e.target.value)} />
        <Input label={t('myFarm.soilType')} value={soilType} onChange={(e) => setSoilType(e.target.value)} />
        <Input label={t('myFarm.irrigationType')} value={irrigationType} onChange={(e) => setIrrigationType(e.target.value)} />
        <Button
          className="w-full"
          disabled={!name}
          onClick={() =>
            onSave({
              name,
              location_name: location || null,
              location_lat: coords?.lat ?? null,
              location_lng: coords?.lng ?? null,
              land_size: landSize ? Number(landSize) : null,
              soil_type: soilType || null,
              irrigation_type: irrigationType || null,
            })
          }
        >
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}

function CropFormModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (data: Partial<Crop> & { name: string }) => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [variety, setVariety] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [harvestDate, setHarvestDate] = useState('')

  return (
    <Modal open={open} onClose={onClose} title={t('common.add') + ' ' + t('myFarm.crops')}>
      <div className="space-y-4">
        <Input label={t('myFarm.cropName')} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('myFarm.variety')} value={variety} onChange={(e) => setVariety(e.target.value)} />
        {/* The planting date is what every "Day N" in Farm Progress counts from — without
            it the crop has no timeline at all, so it's worth asking for up front. */}
        <Input label={t('myFarm.plantingDate')} type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} />
        <Input label={t('myFarm.expectedHarvest')} type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
        <Button
          className="w-full"
          disabled={!name}
          onClick={() => {
            onSave({
              name,
              variety: variety || null,
              planting_date: plantingDate || null,
              expected_harvest_date: harvestDate || null,
              stage: plantingDate ? 'sowing' : 'preparation',
              stage_progress: 0,
            })
            setName('')
            setVariety('')
            setPlantingDate('')
            setHarvestDate('')
          }}
        >
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}
