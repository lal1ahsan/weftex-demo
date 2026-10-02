import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { PageLoader } from '@/components/ui/PageLoader'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const FactoryOverviewPage = lazy(() => import('@/pages/factory/FactoryOverviewPage'))
const UsersPage = lazy(() => import('@/pages/factory/UsersPage'))
const ShiftsPage = lazy(() => import('@/pages/factory/ShiftsPage'))
const LoomDashboardPage = lazy(() => import('@/pages/looms/LoomDashboardPage'))
const LoomListPage = lazy(() => import('@/pages/looms/LoomListPage'))
const LoomStatusPage = lazy(() => import('@/pages/looms/LoomStatusPage'))
const LoomDetailPage = lazy(() => import('@/pages/looms/LoomDetailPage'))
const YarnInventoryPage = lazy(() => import('@/pages/yarn/YarnInventoryPage'))
const YarnPurchasesPage = lazy(() => import('@/pages/yarn/YarnPurchasesPage'))
const YarnIssuesPage = lazy(() => import('@/pages/yarn/YarnIssuesPage'))
const ProductionDashboardPage = lazy(() => import('@/pages/production/ProductionDashboardPage'))
const DailyProductionPage = lazy(() => import('@/pages/production/DailyProductionPage'))
const ProductionPlansPage = lazy(() => import('@/pages/production/ProductionPlansPage'))
const WastagePage = lazy(() => import('@/pages/production/WastagePage'))
const DowntimeDashboardPage = lazy(() => import('@/pages/downtime/DowntimeDashboardPage'))
const DowntimeRecordsPage = lazy(() => import('@/pages/downtime/DowntimeRecordsPage'))
const FabricInventoryPage = lazy(() => import('@/pages/fabric/FabricInventoryPage'))
const FabricDetailPage = lazy(() => import('@/pages/fabric/FabricDetailPage'))
const RollsPage = lazy(() => import('@/pages/fabric/RollsPage'))
const RollDetailPage = lazy(() => import('@/pages/fabric/RollDetailPage'))
const QualityPage = lazy(() => import('@/pages/quality/QualityPage'))
const CustomersPage = lazy(() => import('@/pages/sales/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/pages/sales/CustomerDetailPage'))
const SalesOrdersPage = lazy(() => import('@/pages/sales/SalesOrdersPage'))
const SalesOrderDetailPage = lazy(() => import('@/pages/sales/SalesOrderDetailPage'))
const DispatchPage = lazy(() => import('@/pages/sales/DispatchPage'))
const SuppliersPage = lazy(() => import('@/pages/purchases/SuppliersPage'))
const PurchaseOrdersPage = lazy(() => import('@/pages/purchases/PurchaseOrdersPage'))
const ExpensesPage = lazy(() => import('@/pages/expenses/ExpensesPage'))
const ProductionCostPage = lazy(() => import('@/pages/costing/ProductionCostPage'))
const CostPerMeterPage = lazy(() => import('@/pages/costing/CostPerMeterPage'))
const ElectricityPage = lazy(() => import('@/pages/electricity/ElectricityPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const ReportDetailPage = lazy(() => import('@/pages/reports/ReportDetailPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="factory" element={<FactoryOverviewPage />} />
          <Route path="factory/users" element={<UsersPage />} />
          <Route path="factory/shifts" element={<ShiftsPage />} />

          <Route path="looms" element={<LoomDashboardPage />} />
          <Route path="looms/list" element={<LoomListPage />} />
          <Route path="looms/status" element={<LoomStatusPage />} />
          <Route path="looms/:id" element={<LoomDetailPage />} />

          <Route path="yarn" element={<YarnInventoryPage />} />
          <Route path="yarn/purchases" element={<YarnPurchasesPage />} />
          <Route path="yarn/issues" element={<YarnIssuesPage />} />

          <Route path="production" element={<ProductionDashboardPage />} />
          <Route path="production/daily" element={<DailyProductionPage />} />
          <Route path="production/plans" element={<ProductionPlansPage />} />
          <Route path="production/wastage" element={<WastagePage />} />

          <Route path="downtime" element={<DowntimeDashboardPage />} />
          <Route path="downtime/records" element={<DowntimeRecordsPage />} />

          <Route path="fabric" element={<FabricInventoryPage />} />
          <Route path="fabric/rolls" element={<RollsPage />} />
          <Route path="fabric/rolls/:id" element={<RollDetailPage />} />
          <Route path="fabric/:code" element={<FabricDetailPage />} />

          <Route path="quality" element={<QualityPage />} />

          <Route path="sales" element={<Navigate to="/sales/orders" replace />} />
          <Route path="sales/customers" element={<CustomersPage />} />
          <Route path="sales/customers/:id" element={<CustomerDetailPage />} />
          <Route path="sales/orders" element={<SalesOrdersPage />} />
          <Route path="sales/orders/:id" element={<SalesOrderDetailPage />} />
          <Route path="sales/dispatch" element={<DispatchPage />} />

          <Route path="purchases" element={<Navigate to="/purchases/orders" replace />} />
          <Route path="purchases/suppliers" element={<SuppliersPage />} />
          <Route path="purchases/orders" element={<PurchaseOrdersPage />} />

          <Route path="expenses" element={<ExpensesPage />} />

          <Route path="costing" element={<ProductionCostPage />} />
          <Route path="costing/per-meter" element={<CostPerMeterPage />} />

          <Route path="electricity" element={<Navigate to="/electricity/grid" replace />} />
          <Route path="electricity/:tab" element={<ElectricityPage />} />

          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:slug" element={<ReportDetailPage />} />

          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
