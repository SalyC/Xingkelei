const Footer = () => {
    return (
        <footer className="border-t bg-white py-4 px-6 text-sm text-muted-foreground">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <p>
                    © xingkeleiYang, 2026. Клуб Синкэлэй — облачная платформа цифрового
                    образования. Платформа используется с целью оказания образовательных
                    услуг.
                    </p>
                    <p className="mt-1">
                        Мы используем файлы cookie для персонализации сервисов и повышения
                        удобства пользования сайтом. Если вы не согласны на их использование,
                        поменяйте настройки браузера.
                    </p>
                </div>
                <div className="flex gap-4 whitespace-nowrap">
                    <span>Контакты:</span>
                    <a
                        href="mailto:Kovrigasa@college.omsu.ru"
                        className="hover:underline"
                    >
                        Kovrigasa@college.omsu.ru
                    </a>
                    <a
                        href="https://t.me/yangchessman"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        t.me/yangchessman
                    </a>
                    <a
                        href="https://t.me/xingkeleiYang"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        t.me/xingkeleiYang
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default Footer