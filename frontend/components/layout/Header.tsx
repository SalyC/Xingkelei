'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const Header = () => {
    const router = useRouter()
    const user = { first_name: 'Денисенко', last_name: 'Дмитрий', role: 'Студент курса' }
// ВРЕМЕННО, ПОТОМ ИЗ АПИ СДЕЛАЙ СУКА НЕ ЗАБУДЬ

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        router.push('/login')
    }
    
    return (
    <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Avatar>
                <AvatarImage src="/avatar.png" />
                <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="font-semibold">{user.first_name} {user.last_name}</h2>
                <p className="text-sm text-muted-foreground">{user.role}</p>
            </div>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
            Выйти
        </Button>
    </header>
    )
}

export default Header