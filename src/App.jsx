import HeroScene from './components/HeroScene'
import RainEffect from './components/RainEffect'
import SteamEffect from './components/SteamEffect'
import Title from './components/Title'
import MusicPlayer from './components/MusicPlayer'
import Clock from './components/Clock'
import VisitorCounter from './components/VisitorCounter'

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <HeroScene />
      <SteamEffect />
      <RainEffect />

      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 sm:p-8 md:p-10 safe-pt safe-pb safe-pl safe-pr"
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <Clock />
          <VisitorCounter />
        </div>

        <div className="flex flex-1 items-center justify-center px-2">
          <Title />
        </div>

        <div className="pointer-events-auto flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-8">
          <MusicPlayer />
        </div>
      </div>
    </div>
  )
}
