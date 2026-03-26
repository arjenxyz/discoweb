'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  description: string;
  lastChecked: string;
  responseTime?: number;
  uptime?: number;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startedAt: string;
  updatedAt: string;
  description: string;
  affectedServices: string[];
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`status_api_failed_${res.status}`);
      }
      const payload = await res.json();
      setServices(Array.isArray(payload.services) ? payload.services : []);
      setIncidents(Array.isArray(payload.incidents) ? payload.incidents : []);
      setLastRefresh(new Date());
    } catch (err) {
      setLoadError('Durum bilgileri alınamadı.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'down':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'maintenance':
        return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  const getIncidentStatusColor = (status: Incident['status']) => {
    switch (status) {
      case 'investigating':
        return 'text-yellow-600 bg-yellow-50';
      case 'identified':
        return 'text-orange-600 bg-orange-50';
      case 'monitoring':
        return 'text-blue-600 bg-blue-50';
      case 'resolved':
        return 'text-green-600 bg-green-50';
    }
  };

  const overallStatus = services.length === 0
    ? 'degraded'
    : services.every(s => s.status === 'operational')
      ? 'operational'
      : services.some(s => s.status === 'down')
        ? 'down'
        : 'degraded';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#5865F2] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">DW</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DiscoWeb Status</h1>
                <p className="text-sm text-gray-600">Sistem durumu ve servis performansı</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Son güncelleme</p>
                <p className="text-sm font-medium text-gray-700">
                  {lastRefresh.toLocaleTimeString('tr-TR')}
                </p>
              </div>
              <button
                onClick={refreshStatus}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Yenile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className={`rounded-xl border-2 p-8 text-center ${
          overallStatus === 'operational' ? 'bg-green-50 border-green-200' :
          overallStatus === 'down' ? 'bg-red-50 border-red-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex justify-center mb-4">
            {getStatusIcon(overallStatus)}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            overallStatus === 'operational' ? 'text-green-800' :
            overallStatus === 'down' ? 'text-red-800' :
            'text-yellow-800'
          }`}>
            {overallStatus === 'operational' ? 'Tüm Sistemler Çalışıyor' :
             overallStatus === 'down' ? 'Sorun Bildirildi' :
             'Bazı Servislerde Yavaşlık'}
          </h2>
          <p className="text-gray-600">
            {overallStatus === 'operational' 
              ? 'Tüm servisler beklenen performansla çalışıyor.'
              : 'Bazı servislerde performans sorunları tespit edildi.'}
          </p>
        </div>

        {/* Services Grid */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Servis Durumu</h3>
          {loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}
          <div className="grid gap-4">
            {services.map((service) => (
              <div key={service.name} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Response Time</p>
                      <p className="text-sm font-medium text-gray-700">
                        {service.responseTime != null ? `${service.responseTime}ms` : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Uptime</p>
                      <p className="text-sm font-medium text-gray-700">
                        {service.uptime != null ? `${service.uptime}%` : '-'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                      {service.status === 'operational' ? 'Çalışıyor' :
                       service.status === 'degraded' ? 'Yavaş' :
                       service.status === 'down' ? 'Kapalı' : 'Bakım'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        {incidents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktik Olaylar</h3>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{incident.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getIncidentStatusColor(incident.status)}`}>
                      {incident.status === 'investigating' ? 'Araştırılıyor' :
                       incident.status === 'identified' ? 'Tespit Edildi' :
                       incident.status === 'monitoring' ? 'İzleniyor' : 'Çözüldü'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Başlangıç: {new Date(incident.startedAt).toLocaleString('tr-TR')}</span>
                    <span>Güncelleme: {new Date(incident.updatedAt).toLocaleString('tr-TR')}</span>
                    <span>Etkilenen: {incident.affectedServices.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center text-sm text-gray-500">
            <p>Sistem durumu her 30 saniyede bir otomatik olarak güncellenir.</p>
            <p className="mt-2">Sorun bildirmek için: <a href="/contact" className="text-[#5865F2] hover:underline">İletişim</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
