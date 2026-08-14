import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppShell } from './components/app-shell'
import { AdminPage } from './pages/admin-page'
import { CreateListingPage } from './pages/create-listing-page'
import { HomePage } from './pages/home-page'
import { LoginPage } from './pages/login-page'
import { NotFoundPage } from './pages/not-found-page'
import { ProfilePage } from './pages/profile-page'
import { PropertyPage } from './pages/property-page'
import { RegisterPage } from './pages/register-page'
import { WishlistPage } from './pages/wishlist-page'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'properties/:id', element: <PropertyPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'create-listing', element: <CreateListingPage /> },
      { path: 'edit-listing/:id', element: <CreateListingPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
