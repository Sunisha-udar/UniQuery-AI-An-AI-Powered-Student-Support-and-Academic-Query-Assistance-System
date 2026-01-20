import { useState, type FormEvent } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Settings, Shield, Database, Mail, Globe } from 'lucide-react'

export function AdminSettings() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'UniQuery',
        supportEmail: 'support@university.edu',
        maxFileSize: '10',
        sessionTimeout: '30',
    })

    const [emailSettings, setEmailSettings] = useState({
        smtpHost: 'smtp.university.edu',
        smtpPort: '587',
        smtpUser: 'noreply@university.edu',
        enableNotifications: true,
    })

    const [aiSettings, setAISettings] = useState({
        model: 'gpt-4',
        temperature: '0.7',
        maxTokens: '2000',
        confidenceThreshold: '70',
    })

    const handleSave = async (e: FormEvent, section: string) => {
        e.preventDefault()
        setLoading(true)
        setSuccess('')

        // Simulate save
        setTimeout(() => {
            setSuccess(`${section} settings saved successfully!`)
            setLoading(false)
            setTimeout(() => setSuccess(''), 3000)
        }, 1000)
    }

    return (
        <DashboardLayout variant="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Settings</h1>
                        <p className="text-sm text-text-muted mt-1">Manage system configuration</p>
                    </div>
                </div>

                {success && (
                    <div className="p-4 bg-success/10 text-success text-sm rounded-lg border border-success/20">
                        {success}
                    </div>
                )}

                {/* General Settings */}
                <Card className="border border-border shadow-sm">
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold text-text">General Settings</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => handleSave(e, 'General')} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Site Name"
                                    value={generalSettings.siteName}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                />
                                <Input
                                    label="Support Email"
                                    type="email"
                                    value={generalSettings.supportEmail}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                                />
                                <Input
                                    label="Max File Size (MB)"
                                    type="number"
                                    value={generalSettings.maxFileSize}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, maxFileSize: e.target.value })}
                                />
                                <Input
                                    label="Session Timeout (minutes)"
                                    type="number"
                                    value={generalSettings.sessionTimeout}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, sessionTimeout: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" loading={loading} className="w-full md:w-auto">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Email Settings */}
                <Card className="border border-border shadow-sm">
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold text-text">Email Configuration</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => handleSave(e, 'Email')} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="SMTP Host"
                                    value={emailSettings.smtpHost}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                                />
                                <Input
                                    label="SMTP Port"
                                    type="number"
                                    value={emailSettings.smtpPort}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="SMTP User"
                                        type="email"
                                        value={emailSettings.smtpUser}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="emailNotifications"
                                    checked={emailSettings.enableNotifications}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, enableNotifications: e.target.checked })}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                                />
                                <label htmlFor="emailNotifications" className="text-sm text-text cursor-pointer">
                                    Enable email notifications
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" loading={loading} className="w-full md:w-auto">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* AI Settings */}
                <Card className="border border-border shadow-sm">
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold text-text">AI Configuration</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => handleSave(e, 'AI')} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-muted mb-2">AI Model</label>
                                    <select
                                        value={aiSettings.model}
                                        onChange={(e) => setAISettings({ ...aiSettings, model: e.target.value })}
                                        className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        aria-label="Select AI Model"
                                    >
                                        <option value="gpt-4">GPT-4</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        <option value="claude-3">Claude 3</option>
                                    </select>
                                </div>
                                <Input
                                    label="Temperature"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    value={aiSettings.temperature}
                                    onChange={(e) => setAISettings({ ...aiSettings, temperature: e.target.value })}
                                />
                                <Input
                                    label="Max Tokens"
                                    type="number"
                                    value={aiSettings.maxTokens}
                                    onChange={(e) => setAISettings({ ...aiSettings, maxTokens: e.target.value })}
                                />
                                <Input
                                    label="Confidence Threshold (%)"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={aiSettings.confidenceThreshold}
                                    onChange={(e) => setAISettings({ ...aiSettings, confidenceThreshold: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" loading={loading} className="w-full md:w-auto">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="border border-border shadow-sm">
                    <CardHeader className="border-b border-border">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold text-text">Security & Privacy</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div>
                                    <p className="text-sm font-medium text-text">Two-Factor Authentication</p>
                                    <p className="text-xs text-text-muted mt-0.5">Require 2FA for admin accounts</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div>
                                    <p className="text-sm font-medium text-text">Query Logging</p>
                                    <p className="text-xs text-text-muted mt-0.5">Log all user queries for analysis</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium text-text">Data Encryption</p>
                                    <p className="text-xs text-text-muted mt-0.5">Encrypt sensitive data at rest</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
