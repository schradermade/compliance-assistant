import { IncidentsCard } from "../components/dashboard/IncidentsCard";
import { IngestionJobsCard } from "../components/dashboard/IngestionJobsCard";
import { KpiGrid } from "../components/dashboard/KpiGrid";
import { TenantHealthCard } from "../components/dashboard/TenantHealthCard";
import { Topbar } from "../components/dashboard/Topbar";
import { loadDashboardData } from "../lib/dashboard/api";
import { normalizeDashboardFilters } from "../lib/dashboard/filters";
import { rangeOptions, tenantOptions } from "../lib/dashboard/options";
import { buildDashboardViewModel } from "../lib/dashboard/view-model";

export default async function DashboardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeDashboardFilters(resolvedSearchParams);
  const dashboardData = await loadDashboardData(filters);

  const viewModel = buildDashboardViewModel({
    selectedTenant: filters.tenantId,
    metricsResult: dashboardData.metricsResult,
    jobsResult: dashboardData.jobsResult,
    incidentsResult: dashboardData.incidentsResult,
  });

  return (
    <main className="shell">
      <Topbar
        selectedTenant={filters.tenantId}
        selectedRange={filters.range}
        tenantOptions={tenantOptions}
        rangeOptions={rangeOptions}
        dataMode={viewModel.dataMode}
      />

      <KpiGrid kpis={viewModel.kpis} />

      <section className="main-grid">
        <TenantHealthCard
          tenantScopeLabel={viewModel.tenantScopeLabel}
          tenantRows={viewModel.tenantRows}
        />
        <IngestionJobsCard jobs={viewModel.jobs} />
      </section>

      <IncidentsCard incidents={viewModel.incidents} />
    </main>
  );
}
