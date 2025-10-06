import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Search,
  PlusCircle,
  User,
  Power,
  PowerOff,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useUser } from '../store/useUser'

export default function BottomNav({showNav}) {
  const { user, loading } = useUser()
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    } else {
      alert("You = Signed Out!!!")
      window.location.href = '/auth' // redirect to login
    }
  }

  const handleSignIn = () => {
    window.location.href = '/auth' // redirect to login

    return;
  }
  
  const navItems = [
    { to: '/', icon: <Home />, label: 'Home' },
    { to: '/explore', icon: <Search />, label: 'Explore' },
    { to: '/create', icon: <PlusCircle />, label: 'Create' },
    { to: '/you', icon: <User />, label: 'You' },
    { to: '/auth', icon: <Power/>, label: 'Login' },
    { to: '/auth', icon: <PowerOff/>, label: 'Logout' },
  ]

  return (
    <>
        {showNav && (<nav className="fixed bottom-0 w-full z-50 backdrop-blur-md bg-white/80 dark:bg-black/50 border-t border-gray-200 dark:border-gray-700 shadow-t transition-all">
      <ul className="flex justify-around items-center py-2 max-w-md mx-auto">
        {navItems.map(({ to, icon, label }) => {
          if (!user && label=='Logout') return
          if (!user && label=='You') return
          if (user && label=='Login') return
          const active = isActive(to)
          return (
            <li key={to}>
              <Link
                to={to}
                onClick={()=>{
                  if(label=='Login'){
                    return handleSignIn();
                  }else if(label=='Logout'){
                    return handleSignOut();
                  }}}
                className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-all ${
                  active
                    ? 'text-black dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                    active
                      ? 'bg-gray-200 dark:bg-gray-700 shadow-md'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {icon}
                </div>
                <span className="hidden sm:block">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>)
    
  }
  </>
  )
}
