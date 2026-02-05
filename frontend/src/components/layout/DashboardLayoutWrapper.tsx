import { Outlet } from 'react-router-dom'
import { DashboardLayout } from './DashboardLayout'

interface DashboardLayoutWrapperProps {
    variant: 'admin' | 'student'
}

export function DashboardLayoutWrapper({ variant }: DashboardLayoutWrapperProps) {
    return (
        <DashboardLayout variant={variant}>
            <Outlet />
        </DashboardLayout>
    )
}
