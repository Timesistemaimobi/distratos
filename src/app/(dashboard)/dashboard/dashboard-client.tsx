"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Solicitacao } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { LayoutDashboard, CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from "lucide-react";

interface DashboardClientProps {
  initialMes: string;
  total: number;
  finalizados: number;
  cancelados: number;
  pendentes: number;
  atrasados: number;
  chartEmpreendimento: { name: string; value: number }[];
  chartSituacao: { name: string; value: number; color: string }[];
}

export function DashboardClient({
  initialMes,
  total,
  finalizados,
  cancelados,
  pendentes,
  atrasados,
  chartEmpreendimento,
  chartSituacao
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mes, setMes] = useState(initialMes);

  const handleMesChange = (newMes: string) => {
    setMes(newMes);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", newMes);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 space-y-8 max-w-[1400px] mx-auto w-full">
      {/* Header and Filter */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">Visão geral e indicadores minimalistas.</p>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[280px]">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Calendar size={16} /> Mês de Referência
          </Label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => handleMesChange(e.target.value)}
            className="h-12 text-lg rounded-xl bg-white dark:bg-zinc-900 border-zinc-300 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><LayoutDashboard size={64} /></div>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Total Geral</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-5xl font-light text-zinc-900 dark:text-zinc-50 tracking-tighter">{total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500"><CheckCircle size={64} /></div>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-emerald-600/80 uppercase tracking-wider">Finalizados</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-5xl font-light text-emerald-500 tracking-tighter">{finalizados}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-500"><Clock size={64} /></div>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-amber-600/80 uppercase tracking-wider">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-5xl font-light text-amber-500 tracking-tighter">{pendentes}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-rose-500"><AlertTriangle size={64} /></div>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-rose-600/80 uppercase tracking-wider">Atrasados</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-5xl font-light text-rose-500 tracking-tighter">{atrasados}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-red-500"><XCircle size={64} /></div>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-red-600/80 uppercase tracking-wider">Cancelados</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-5xl font-light text-red-500 tracking-tighter">{cancelados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 p-2">
          <CardHeader className="pt-6 pb-2 px-8">
            <CardTitle className="text-xl font-medium">Volume por Empreendimento</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartEmpreendimento} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={13} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                <YAxis fontSize={13} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 p-2">
          <CardHeader className="pt-6 pb-2 px-8">
            <CardTitle className="text-xl font-medium">Distribuição por Situação</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartSituacao} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {chartSituacao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ paddingLeft: '20px', fontSize: '14px', fontFamily: 'inherit' }}
                  formatter={(value, entry: any) => <span className="text-zinc-700 dark:text-zinc-300 ml-1">{value} ({entry.payload.value})</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
