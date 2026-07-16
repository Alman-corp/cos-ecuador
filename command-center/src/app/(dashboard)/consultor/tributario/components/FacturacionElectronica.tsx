"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2, Download, Search, Key, Shield } from "lucide-react"

export function FacturacionElectronica() {
  return (
    <Tabs defaultValue="emitir" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="emitir" className="gap-2"><FileText className="h-4 w-4" /> Emitir Factura</TabsTrigger>
        <TabsTrigger value="certificados" className="gap-2"><Key className="h-4 w-4" /> Certificados</TabsTrigger>
        <TabsTrigger value="historial" className="gap-2"><Search className="h-4 w-4" /> Historial</TabsTrigger>
      </TabsList>
      <TabsContent value="emitir" className="mt-6"><EmisionForm /></TabsContent>
      <TabsContent value="certificados" className="mt-6"><CertificadosManager /></TabsContent>
      <TabsContent value="historial" className="mt-6"><FacturasHistorial /></TabsContent>
    </Tabs>
  )
}

function EmisionForm() {
  const [rucComprador, setRucComprador] = useState("")
  const [validacionRuc, setValidacionRuc] = useState<any>(null)
  const [detalles, setDetalles] = useState([{ description: "", quantity: 1, unitPrice: 100, ivaRate: 15 }])
  const queryClient = useQueryClient()

  const { data: certificados } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => { const r = await fetch("/api/facturacion/certificates"); return r.json() },
  })

  const validarRuc = useMutation({
    mutationFn: async (ruc: string) => {
      const r = await fetch("/api/facturacion/ruc/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ruc }) })
      return r.json()
    },
    onSuccess: (data) => setValidacionRuc(data),
  })

  const emitir = useMutation({
    mutationFn: async (payload: any) => {
      const r = await fetch("/api/facturacion/invoices/emit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["facturas-historial"] }); alert("Factura enviada al SRI.") },
  })

  const handleEmitir = () => {
    const certDefault = certificados?.certificates?.find((c: any) => c.isDefault && c.status === "ACTIVE")
    emitir.mutate({
      client_id: "self", certificate_id: certDefault?.id || "pending",
      buyer_ruc: rucComprador, buyer_name: validacionRuc?.razon_social || "",
      details: detalles.map(d => ({ ...d, totalPrice: d.quantity * d.unitPrice })),
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Emision de Factura Electronica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>RUC del comprador</Label>
            <div className="flex gap-2">
              <Input value={rucComprador} onChange={(e) => setRucComprador(e.target.value)} placeholder="1790012345001" maxLength={13} />
              <Button variant="outline" onClick={() => validarRuc.mutate(rucComprador)} disabled={validarRuc.isPending || rucComprador.length !== 13}>
                {validarRuc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {validacionRuc && (
              <Alert>
                {validacionRuc.exists ? (
                  <AlertDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <strong>{validacionRuc.razon_social}</strong>
                    </div>
                    <div className="text-sm">Estado: {validacionRuc.active ? "ACTIVO" : "INACTIVO"}</div>
                  </AlertDescription>
                ) : (
                  <AlertDescription><XCircle className="h-4 w-4 inline" /> RUC no encontrado</AlertDescription>
                )}
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label>Detalles</Label>
            {detalles.map((d, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center border p-2 rounded">
                <Input className="col-span-5" placeholder="Descripcion" value={d.description} onChange={(e) => { const nd = [...detalles]; nd[i].description = e.target.value; setDetalles(nd) }} />
                <Input className="col-span-2" type="number" value={d.quantity} onChange={(e) => { const nd = [...detalles]; nd[i].quantity = +e.target.value; setDetalles(nd) }} />
                <Input className="col-span-2" type="number" value={d.unitPrice} onChange={(e) => { const nd = [...detalles]; nd[i].unitPrice = +e.target.value; setDetalles(nd) }} />
                <select className="col-span-2 px-2 py-1 border rounded text-sm" value={d.ivaRate} onChange={(e) => { const nd = [...detalles]; nd[i].ivaRate = +e.target.value; setDetalles(nd) }}>
                  <option value={0}>0%</option><option value={12}>12%</option><option value={15}>15%</option>
                </select>
                <Button className="col-span-1" size="sm" variant="ghost" onClick={() => setDetalles(detalles.filter((_, j) => j !== i))}>x</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setDetalles([...detalles, { description: "", quantity: 1, unitPrice: 100, ivaRate: 15 }])}>+ Agregar linea</Button>
          </div>
          <Button onClick={handleEmitir} disabled={emitir.isPending} className="w-full">
            {emitir.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</> : <><Shield className="h-4 w-4 mr-2" /> Emitir Factura</>}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Proceso</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>1.</strong> Validacion RUC contra catastro SRI</div>
          <div><strong>2.</strong> Generacion XML factura</div>
          <div><strong>3.</strong> Firma XAdES-BES con certificado digital</div>
          <div><strong>4.</strong> Envio SOAP al SRI (Recepcion)</div>
          <div><strong>5.</strong> Consulta de autorizacion (polling)</div>
          <Alert className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>Reintentos automaticos si el SRI esta caido.</AlertDescription></Alert>
        </CardContent>
      </Card>
    </div>
  )
}

function CertificadosManager() {
  const [alias, setAlias] = useState("")
  const queryClient = useQueryClient()
  const { data: certificados } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => { const r = await fetch("/api/facturacion/certificates"); return r.json() },
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Subir Certificado Digital</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Alert><Shield className="h-4 w-4" /><AlertDescription>El .p12 se cifra en S3 y el passphrase en Vault. Nunca en BD.</AlertDescription></Alert>
          <div className="space-y-2"><Label>Archivo .p12</Label><Input type="file" accept=".p12,.pfx" /></div>
          <div className="space-y-2"><Label>Passphrase</Label><Input type="password" placeholder="Contrasena del certificado" /></div>
          <Button className="w-full"><Upload className="h-4 w-4 mr-2" /> Subir Certificado</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Certificados Registrados</CardTitle></CardHeader>
        <CardContent>
          {(!certificados?.certificates || certificados.certificates.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">No hay certificados</div>
          ) : (
            <div className="space-y-2">
              {certificados.certificates.map((c: any) => (
                <div key={c.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <strong>{c.alias}</strong>
                    <Badge variant={c.status === "ACTIVE" ? "default" : "destructive"}>{c.status}</Badge>
                  </div>
                  <div className="text-xs mt-1">Vence: {new Date(c.validTo).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FacturasHistorial() {
  const { data: facturas, isLoading } = useQuery({
    queryKey: ["facturas-historial"],
    queryFn: async () => { const r = await fetch("/api/facturacion/invoices"); return r.json() },
  })

  if (isLoading) return <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Fecha</TableHead><TableHead>Comprador</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {(!facturas || facturas.length === 0) ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No hay facturas emitidas</TableCell></TableRow>
            ) : facturas.map((f: any) => (
              <TableRow key={f.id}>
                <TableCell>{new Date(f.emissionDate).toLocaleDateString("es-EC")}</TableCell>
                <TableCell className="font-medium">{f.buyerName}</TableCell>
                <TableCell>${f.totalAmount}</TableCell>
                <TableCell><Badge>{f.status || "DRAFT"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> XML</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
