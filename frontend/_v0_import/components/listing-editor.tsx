'use client'

import { useState } from 'react'
import { ArrowRight, BedDouble, Building2, Camera, Castle, Check, CheckCircle, ClipboardList, Container, Gem, Home, IndianRupee, Landmark, List, Ship, TentTree, TreePine, Hotel, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const propertyTypes = [
  ['House', Home], ['Flat/apartment', Building2], ['Barn', Landmark], ['Bed & breakfast', BedDouble], ['Boat', Ship], ['Cabin', TentTree], ['Campervan/motorhome', Container], ['Casa particular', Home], ['Castle', Castle], ['Cave', Gem], ['Container', Container], ['Cycladic home', Home], ['Dammuso', Home], ['Dome', TentTree], ['Earth home', TreePine], ['Farm', TreePine], ['Guest house', Home], ['Hotel', Hotel],
] as const

const steps = [
  { id: 0, title: 'Property type', icon: Home },
  { id: 1, title: 'Home basics', icon: List },
  { id: 2, title: 'Photos & description', icon: Camera },
  { id: 3, title: 'Pricing & discounts', icon: IndianRupee },
  { id: 4, title: 'Publish', icon: CheckCircle },
]

const counters = [['Guests', 'guests'], ['Bedrooms', 'bedrooms'], ['Beds', 'beds'], ['Bathrooms', 'baths']] as const

type Basics = { guests: number; bedrooms: number; beds: number; baths: number }

export function ListingCreationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [propertyType, setPropertyType] = useState('')
  const [basics, setBasics] = useState<Basics>({ guests: 1, bedrooms: 1, beds: 1, baths: 1 })
  const [price, setPrice] = useState(2477)

  const updateCount = (key: keyof Basics, delta: number) => setBasics((value) => ({ ...value, [key]: Math.max(0, value[key] + delta) }))
  const publish = () => { toast.success('Listing published!'); router.push('/host/listings') }

  return <main className="flex min-h-screen bg-white text-[#222222]">
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[30vw] min-w-[360px] flex-col bg-[#222222] px-8 py-7 text-white">
      <div className="text-4xl leading-none" aria-label="Airbnb">⌂</div>
      <h1 className="mt-14 max-w-xs text-[44px] font-bold leading-[1.05] tracking-tight">Complete your listing</h1>
      <p className="mt-3 text-lg text-gray-400">Review the details before you publish.</p>
      <nav className="mt-14 space-y-5" aria-label="Listing steps">
        <h2 className="text-base font-semibold text-gray-400">{currentStep ? 'Completed' : 'Next steps'}</h2>
        {steps.filter((step) => step.id < currentStep).map(({ id, title, icon: Icon }) => <button key={id} type="button" onClick={() => setCurrentStep(id)} className="flex w-full items-center gap-4 text-left"><span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#2d2d2d]"><Check className="size-7 text-emerald-400" /></span><span className="min-w-0 flex-1"><span className="block text-base font-semibold">{title}</span><span className="block text-base text-gray-500">Completed</span></span><ArrowRight className="size-6 text-gray-400" /></button>)}
        {steps.filter((step) => step.id >= currentStep).map(({ id, title, icon: Icon }) => <button key={id} type="button" onClick={() => setCurrentStep(id)} className={`flex w-full items-center gap-4 text-left ${id === currentStep ? 'font-bold' : ''}`}><span className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${id === currentStep ? 'bg-white text-[#222]' : 'bg-[#2d2d2d] text-gray-300'}`}><Icon className="size-7" strokeWidth={1.7} /></span><span className="min-w-0 flex-1"><span className="block text-base">{title}</span><span className="block text-base text-gray-500">{id === currentStep ? 'Current step' : 'Next step'}</span></span><ArrowRight className="size-6 text-gray-400" /></button>)}
      </nav>
    </aside>

    <section className="ml-[30vw] min-h-screen w-[70vw] overflow-y-auto bg-white px-8 pb-32 pt-16 lg:px-20">
      <div className="absolute right-8 top-5 flex items-center gap-4"><button className="rounded-full border border-gray-200 px-5 py-3 font-semibold hover:border-black">Questions?</button><button aria-label="Close" className="rounded-full border border-gray-200 p-3 hover:border-black"><X className="size-5" /></button></div>
      <div className="mx-auto mt-4 max-w-4xl">
        {currentStep === 0 && <><h2 className="text-center text-4xl font-semibold tracking-tight">Which of these best describes your place?</h2><div className="mt-10 grid grid-cols-3 gap-4">{propertyTypes.map(([label, Icon]) => <button key={label} type="button" onClick={() => setPropertyType(label)} aria-pressed={propertyType === label} className={`flex aspect-[1.45] flex-col items-start gap-2 rounded-xl p-4 text-left transition-colors ${propertyType === label ? 'border-2 border-black bg-gray-50' : 'border border-gray-200 hover:border-black'}`}><Icon className="size-8" strokeWidth={1.5} /><span className="text-lg font-medium">{label}</span></button>)}</div></>}
        {currentStep === 1 && <div className="mx-auto max-w-2xl pt-12"><h2 className="text-center text-4xl font-semibold tracking-tight">Share some basics about your place</h2><div className="mt-12 divide-y divide-gray-200">{counters.map(([label, key]) => <div key={key} className="flex items-center justify-between py-6"><span className="text-xl font-medium">{label}</span><div className="flex items-center gap-5"><button type="button" onClick={() => updateCount(key, -1)} className="flex size-9 items-center justify-center rounded-full border border-gray-400 text-xl" aria-label={`Decrease ${label}`}>−</button><span className="w-5 text-center text-lg">{basics[key]}</span><button type="button" onClick={() => updateCount(key, 1)} className="flex size-9 items-center justify-center rounded-full border border-gray-400 text-xl" aria-label={`Increase ${label}`}>+</button></div></div>)}</div></div>}
        {currentStep === 2 && <div className="pt-12 text-center"><h2 className="text-4xl font-semibold tracking-tight">Add some photos of your house</h2><div className="mt-12 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"><Camera className="size-14 text-gray-500" strokeWidth={1.3} /><p className="mt-5 text-xl font-semibold">Drag and drop your photos here</p><button type="button" className="mt-6 rounded-lg border border-[#222] bg-white px-6 py-3 font-semibold hover:bg-gray-100">Upload from your device</button></div></div>}
        {currentStep === 3 && <div className="pt-12 text-center"><h2 className="text-4xl font-semibold tracking-tight">Now, set your price</h2><div className="mt-20 flex items-center justify-center"><IndianRupee className="size-12" strokeWidth={1.5} /><input aria-label="Nightly price" type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} className="w-72 border-0 text-center text-7xl font-bold outline-none" /></div><p className="mt-5 text-gray-500">You can change this anytime.</p></div>}
        {currentStep === 4 && <div className="mx-auto max-w-2xl pt-12"><h2 className="text-center text-4xl font-semibold tracking-tight">Review your listing</h2><div className="mt-12 divide-y divide-gray-200 rounded-2xl border border-gray-200 p-6"><div className="flex justify-between py-4"><span>Property type</span><strong>{propertyType || 'Not selected'}</strong></div><div className="flex justify-between py-4"><span>Basics</span><strong>{basics.guests} guests · {basics.bedrooms} bedrooms · {basics.beds} beds · {basics.baths} baths</strong></div><div className="flex justify-between py-4"><span>Price</span><strong>₹{price.toLocaleString('en-IN')} per night</strong></div></div></div>}
      </div>
    </section>

    <div className="fixed bottom-0 right-0 z-10 flex w-[70vw] items-center justify-between border-t border-gray-200 bg-white px-8 py-5 lg:px-12"><button type="button" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} className="font-semibold underline disabled:cursor-not-allowed disabled:text-gray-300">Back</button><button type="button" onClick={() => currentStep < 4 ? setCurrentStep((step) => step + 1) : publish()} className="rounded-lg bg-[#222222] px-8 py-3 font-semibold text-white">{currentStep === 4 ? 'Publish' : 'Next'}</button></div>
  </main>
}
