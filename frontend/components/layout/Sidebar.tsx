'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
    { name: 'Мои курсы', href: '/dashboard/courses' },
    { name: 'Другие курсы', href: '/dashboard/other-courses' },
    { name: 'Мои сертификаты', href: '/dashboard/certificates' },
    { name: 'Профиль', href: '/dashboard/profile' },
]

const Sidebar = () => {
    const pathname = usePathname()

    return (
        <aside className='w-64 border-r bg-white p-4 flex flex-col h-screen'>
            <div className='font-bold text-xl mb-6'>Клуб Синкэлэй</div>
            <nav className='flex flex-col gap-2'>
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className='w-full justify-start'
                >
                    {item.name}
                </Button>
                    </Link>
                ))}
                <Separator className='my-2' />
                <Link href='https://t.me/GM_on_the_Rakbot' target='_blank'>
                    <Button variant='ghost' className='w-full justify-start'>
                Вступить в клуб в tg
                    </Button>
                </Link>
            </nav>
        </aside>
    )
}

export default Sidebar