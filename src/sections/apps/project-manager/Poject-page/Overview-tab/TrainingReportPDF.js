import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Svg, Rect, Circle, Line, G, Path } from '@react-pdf/renderer';

// ==============================|| i18n LABELS ||============================== //

const labels = {
  en: {
    trainingReport: 'Training Report',
    executiveSummary: 'Executive Summary',
    learningSummary: 'Learning Summary',
    keyHighlights: 'Key Highlights',
    challenges: 'Challenges',
    attendanceOverview: 'Attendance Overview',
    attendanceTrend: 'Daily Attendance Trend',
    attendanceBreakdown: 'Attendance Breakdown',
    parkingLot: 'Parking Lot Overview',
    dailyBreakdown: 'Daily Breakdown',
    generatedOn: 'Generated on',
    date: 'Date',
    instructor: 'Lead Instructor',
    participants: 'Participants',
    totalDays: 'Total Days',
    totalSessions: 'Total Sessions',
    overallAttendance: 'Overall Attendance',
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    type: 'Type',
    priority: 'Priority',
    status: 'Status',
    daysOpen: 'Days Open',
    title: 'Title',
    open: 'Open',
    resolved: 'Resolved',
    inProgress: 'In Progress',
    total: 'Total',
    items: 'Items',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    sessionNotes: 'Session Notes',
    noHighlights: 'No highlights recorded',
    noChallenges: 'No challenges recorded',
    noNotes: 'No daily notes recorded for this project.',
    noParkingLotItems: 'No parking lot items recorded.',
    page: 'Page',
    projectPeriod: 'Project Period',
    issue: 'Issue',
    question: 'Question',
    confidential: 'Confidential',
  },
  fr: {
    trainingReport: 'Rapport de formation',
    executiveSummary: 'Sommaire exécutif',
    learningSummary: 'Synthèse des apprentissages',
    keyHighlights: 'Points saillants',
    challenges: 'Défis',
    attendanceOverview: 'Aperçu des présences',
    attendanceTrend: 'Tendance quotidienne des présences',
    attendanceBreakdown: 'Répartition des présences',
    parkingLot: 'Stationnement (sujets en suspens)',
    dailyBreakdown: 'Détail quotidien',
    generatedOn: 'Généré le',
    date: 'Date',
    instructor: 'Instructeur principal',
    participants: 'Participants',
    totalDays: 'Jours totaux',
    totalSessions: 'Sessions totales',
    overallAttendance: 'Présence globale',
    present: 'Présent',
    late: 'En retard',
    absent: 'Absent',
    type: 'Type',
    priority: 'Priorité',
    status: 'Statut',
    daysOpen: 'Jours ouverts',
    title: 'Titre',
    open: 'Ouvert',
    resolved: 'Résolu',
    inProgress: 'En cours',
    total: 'Total',
    items: 'Éléments',
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Bas',
    sessionNotes: 'Notes de session',
    noHighlights: 'Aucun point saillant enregistré',
    noChallenges: 'Aucun défi enregistré',
    noNotes: 'Aucune note quotidienne enregistrée pour ce projet.',
    noParkingLotItems: 'Aucun élément en stationnement.',
    page: 'Page',
    projectPeriod: 'Période du projet',
    issue: 'Problème',
    question: 'Question',
    confidential: 'Confidentiel',
  },
  es: {
    trainingReport: 'Informe de capacitación',
    executiveSummary: 'Resumen ejecutivo',
    learningSummary: 'Resumen de aprendizaje',
    keyHighlights: 'Puntos destacados',
    challenges: 'Desafíos',
    attendanceOverview: 'Resumen de asistencia',
    attendanceTrend: 'Tendencia diaria de asistencia',
    attendanceBreakdown: 'Desglose de asistencia',
    parkingLot: 'Temas pendientes',
    dailyBreakdown: 'Desglose diario',
    generatedOn: 'Generado el',
    date: 'Fecha',
    instructor: 'Instructor principal',
    participants: 'Participantes',
    totalDays: 'Días totales',
    totalSessions: 'Sesiones totales',
    overallAttendance: 'Asistencia general',
    present: 'Presente',
    late: 'Tarde',
    absent: 'Ausente',
    type: 'Tipo',
    priority: 'Prioridad',
    status: 'Estado',
    daysOpen: 'Días abiertos',
    title: 'Título',
    open: 'Abierto',
    resolved: 'Resuelto',
    inProgress: 'En progreso',
    total: 'Total',
    items: 'Elementos',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    sessionNotes: 'Notas de sesión',
    noHighlights: 'No se registraron puntos destacados',
    noChallenges: 'No se registraron desafíos',
    noNotes: 'No se registraron notas diarias para este proyecto.',
    noParkingLotItems: 'No se registraron temas pendientes.',
    page: 'Página',
    projectPeriod: 'Período del proyecto',
    issue: 'Problema',
    question: 'Pregunta',
    confidential: 'Confidencial',
  },
  pt: {
    trainingReport: 'Relatório de treinamento',
    executiveSummary: 'Resumo executivo',
    learningSummary: 'Resumo de aprendizado',
    keyHighlights: 'Destaques principais',
    challenges: 'Desafios',
    attendanceOverview: 'Visão geral de presença',
    attendanceTrend: 'Tendência diária de presença',
    attendanceBreakdown: 'Distribuição de presença',
    parkingLot: 'Estacionamento (pendências)',
    dailyBreakdown: 'Detalhamento diário',
    generatedOn: 'Gerado em',
    date: 'Data',
    instructor: 'Instrutor principal',
    participants: 'Participantes',
    totalDays: 'Dias totais',
    totalSessions: 'Sessões totais',
    overallAttendance: 'Presença geral',
    present: 'Presente',
    late: 'Atrasado',
    absent: 'Ausente',
    type: 'Tipo',
    priority: 'Prioridade',
    status: 'Status',
    daysOpen: 'Dias abertos',
    title: 'Título',
    open: 'Aberto',
    resolved: 'Resolvido',
    inProgress: 'Em andamento',
    total: 'Total',
    items: 'Itens',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo',
    sessionNotes: 'Notas de sessão',
    noHighlights: 'Nenhum destaque registrado',
    noChallenges: 'Nenhum desafio registrado',
    noNotes: 'Nenhuma nota diária registrada para este projeto.',
    noParkingLotItems: 'Nenhum item pendente registrado.',
    page: 'Página',
    projectPeriod: 'Período do projeto',
    issue: 'Problema',
    question: 'Pergunta',
    confidential: 'Confidencial',
  },
  de: {
    trainingReport: 'Schulungsbericht',
    executiveSummary: 'Zusammenfassung',
    learningSummary: 'Lernzusammenfassung',
    keyHighlights: 'Wichtige Highlights',
    challenges: 'Herausforderungen',
    attendanceOverview: 'Anwesenheitsübersicht',
    attendanceTrend: 'Täglicher Anwesenheitstrend',
    attendanceBreakdown: 'Anwesenheitsverteilung',
    parkingLot: 'Offene Punkte',
    dailyBreakdown: 'Tägliche Aufschlüsselung',
    generatedOn: 'Erstellt am',
    date: 'Datum',
    instructor: 'Haupttrainer',
    participants: 'Teilnehmer',
    totalDays: 'Gesamttage',
    totalSessions: 'Gesamtsitzungen',
    overallAttendance: 'Gesamtanwesenheit',
    present: 'Anwesend',
    late: 'Verspätet',
    absent: 'Abwesend',
    type: 'Typ',
    priority: 'Priorität',
    status: 'Status',
    daysOpen: 'Tage offen',
    title: 'Titel',
    open: 'Offen',
    resolved: 'Gelöst',
    inProgress: 'In Bearbeitung',
    total: 'Gesamt',
    items: 'Elemente',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    sessionNotes: 'Sitzungsnotizen',
    noHighlights: 'Keine Highlights aufgezeichnet',
    noChallenges: 'Keine Herausforderungen aufgezeichnet',
    noNotes: 'Keine täglichen Notizen für dieses Projekt aufgezeichnet.',
    noParkingLotItems: 'Keine offenen Punkte aufgezeichnet.',
    page: 'Seite',
    projectPeriod: 'Projektzeitraum',
    issue: 'Problem',
    question: 'Frage',
    confidential: 'Vertraulich',
  }
};

// ==============================|| COLORS ||============================== //

const COLORS = {
  primary: '#1976d2',
  primaryDark: '#0d47a1',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  grey: '#9e9e9e',
  lightGrey: '#f5f5f5',
  darkGrey: '#424242',
  text: '#212121',
  textSecondary: '#757575',
  white: '#ffffff',
  border: '#e0e0e0',
};

// ==============================|| STYLES ||============================== //

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.text },
  // Cover
  coverPage: { padding: 40, justifyContent: 'center', alignItems: 'center', flex: 1 },
  logo: { width: 120, height: 60, objectFit: 'contain', marginBottom: 16 },
  coverTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: COLORS.primaryDark, textAlign: 'center', marginBottom: 8 },
  coverSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 4 },
  coverMeta: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  coverLine: { width: 80, height: 3, backgroundColor: COLORS.primary, marginVertical: 20 },
  // Section headers
  sectionTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.primaryDark, marginBottom: 12, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  subSectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.darkGrey, marginBottom: 8, marginTop: 12 },
  // Metrics row
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricBox: { flex: 1, backgroundColor: COLORS.lightGrey, borderRadius: 4, padding: 10, marginHorizontal: 4, alignItems: 'center' },
  metricValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.primary },
  metricLabel: { fontSize: 8, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  // Bullets
  bulletRow: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 4, marginRight: 8 },
  challengeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.warning, marginTop: 4, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primaryDark, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 2 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.white },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tableCell: { fontSize: 9, color: COLORS.text },
  // Daily card
  dayCard: { marginBottom: 14, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 4, padding: 10 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  dayDate: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.primaryDark },
  dayMeta: { fontSize: 8, color: COLORS.textSecondary },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: COLORS.textSecondary },
  // Charts
  chartContainer: { marginVertical: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  legendColor: { width: 8, height: 8, borderRadius: 2, marginRight: 4 },
  legendText: { fontSize: 8, color: COLORS.textSecondary },
  // Stats row for parking lot
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 6, marginHorizontal: 2, backgroundColor: COLORS.lightGrey, borderRadius: 3 },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.primary },
  statLabel: { fontSize: 7, color: COLORS.textSecondary, marginTop: 2 },
  // Session notes
  sessionNotesBox: { backgroundColor: COLORS.lightGrey, padding: 8, borderRadius: 3, borderLeftWidth: 3, borderLeftColor: COLORS.primary, marginTop: 4 },
  sessionNotesText: { fontSize: 8, color: COLORS.textSecondary, lineHeight: 1.4 },
});

// ==============================|| HELPERS ||============================== //

const formatDate = (dateStr, lang) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const locales = { en: 'en-US', fr: 'fr-CA', es: 'es-ES', pt: 'pt-BR', de: 'de-DE' };
  return d.toLocaleDateString(locales[lang] || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatShortDate = (dateStr, lang) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const locales = { en: 'en-US', fr: 'fr-CA', es: 'es-ES', pt: 'pt-BR', de: 'de-DE' };
  return d.toLocaleDateString(locales[lang] || 'en-US', { month: 'short', day: 'numeric' });
};

const daysBetween = (start, end) => {
  if (!start || !end) return '—';
  return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
};

// ==============================|| SVG BAR CHART ||============================== //

const BarChart = ({ data, width = 460, height = 140 }) => {
  if (!data || data.length === 0) return null;
  const barWidth = Math.min(30, (width - 40) / data.length - 4);
  const maxVal = 100;
  const chartH = height - 30;
  const startX = 30;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis labels */}
      <Text x={0} y={12} style={{ fontSize: 7, fill: COLORS.textSecondary }}>100%</Text>
      <Text x={0} y={chartH / 2 + 6} style={{ fontSize: 7, fill: COLORS.textSecondary }}>50%</Text>
      <Text x={6} y={chartH + 6} style={{ fontSize: 7, fill: COLORS.textSecondary }}>0%</Text>
      {/* Grid lines */}
      <Line x1={startX} y1={0} x2={width} y2={0} style={{ stroke: COLORS.border, strokeWidth: 0.5 }} />
      <Line x1={startX} y1={chartH / 2} x2={width} y2={chartH / 2} style={{ stroke: COLORS.border, strokeWidth: 0.5, strokeDasharray: '3,3' }} />
      <Line x1={startX} y1={chartH} x2={width} y2={chartH} style={{ stroke: COLORS.border, strokeWidth: 0.5 }} />
      {/* Bars */}
      {data.map((item, i) => {
        const pct = item.total > 0 ? ((item.present + item.late) / item.total) * 100 : 0;
        const barH = (pct / maxVal) * chartH;
        const x = startX + i * ((width - startX) / data.length) + ((width - startX) / data.length - barWidth) / 2;
        const color = pct >= 80 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.error;
        return (
          <G key={i}>
            <Rect x={x} y={chartH - barH} width={barWidth} height={barH} style={{ fill: color, rx: 2 }} />
            <Text x={x + barWidth / 2 - 6} y={height - 2} style={{ fontSize: 6, fill: COLORS.textSecondary }}>
              {item.label || ''}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
};

// ==============================|| SVG PIE CHART ||============================== //

const PieChart = ({ slices, size = 100 }) => {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 4;
  let startAngle = -90;

  const paths = slices.filter(sl => sl.value > 0).map((sl) => {
    const pct = sl.value / total;
    const angle = pct * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos((Math.PI / 180) * startAngle);
    const y1 = cy + r * Math.sin((Math.PI / 180) * startAngle);
    const x2 = cx + r * Math.cos((Math.PI / 180) * endAngle);
    const y2 = cy + r * Math.sin((Math.PI / 180) * endAngle);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { d, color: sl.color, label: sl.label, pct: Math.round(pct * 100) };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.color} />
        ))}
      </Svg>
      <View style={s.legendRow}>
        {paths.map((p, i) => (
          <View key={i} style={s.legendItem}>
            <View style={[s.legendColor, { backgroundColor: p.color }]} />
            <Text style={s.legendText}>{p.label} ({p.pct}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ==============================|| PAGE FOOTER ||============================== //

const PageFooter = ({ l, projectTitle }) => (
  <View style={s.footer} fixed>
    <Text>{projectTitle} — {l.confidential}</Text>
    <Text render={({ pageNumber, totalPages }) => `${l.page} ${pageNumber} / ${totalPages}`} />
  </View>
);

// ==============================|| COVER PAGE ||============================== //

const CoverPage = ({ data, l, language }) => (
  <Page size="A4" style={[s.page, { justifyContent: 'center', alignItems: 'center' }]}>
    {data.organization?.logoUrl && (
      <Image src={data.organization.logoUrl} style={s.logo} />
    )}
    {data.organization?.title && (
      <Text style={[s.coverSubtitle, { marginBottom: 20 }]}>{data.organization.title}</Text>
    )}
    <View style={s.coverLine} />
    <Text style={s.coverTitle}>{data.project.title}</Text>
    <Text style={s.coverSubtitle}>{l.trainingReport}</Text>
    <View style={s.coverLine} />
    {data.project.startDate && data.project.endDate && (
      <Text style={s.coverMeta}>
        {l.projectPeriod}: {formatDate(data.project.startDate, language)} — {formatDate(data.project.endDate, language)}
      </Text>
    )}
    {data.leadInstructor && (
      <Text style={s.coverMeta}>{l.instructor}: {data.leadInstructor.name}</Text>
    )}
    <Text style={[s.coverMeta, { marginTop: 12 }]}>
      {l.generatedOn} {formatDate(new Date().toISOString(), language)}
    </Text>
    <PageFooter l={l} projectTitle={data.project.title} />
  </Page>
);

// ==============================|| EXECUTIVE SUMMARY PAGE ||============================== //

const ExecutiveSummaryPage = ({ data, l, language }) => {
  const { attendance, participantCount, totalSessions, dailyNotes } = data;
  const totalDays = dailyNotes.length || attendance.byDate.length;
  const totals = attendance.totals;
  const attended = totals.present + totals.late;
  const overallRate = totals.scheduled > 0 ? Math.round((attended / totals.scheduled) * 100) : 0;

  // Bar chart data
  const barData = attendance.byDate.map(d => ({
    present: d.present,
    late: d.late,
    total: d.total,
    label: formatShortDate(d.date, language)
  }));

  // Pie chart slices
  const pieSlices = [
    { value: totals.present, color: COLORS.success, label: l.present },
    { value: totals.late, color: COLORS.warning, label: l.late },
    { value: totals.absent, color: COLORS.error, label: l.absent }
  ];

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>{l.executiveSummary}</Text>

      {/* Metrics row */}
      <View style={s.metricsRow}>
        <View style={s.metricBox}>
          <Text style={s.metricValue}>{totalDays}</Text>
          <Text style={s.metricLabel}>{l.totalDays}</Text>
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricValue}>{totalSessions}</Text>
          <Text style={s.metricLabel}>{l.totalSessions}</Text>
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricValue}>{participantCount}</Text>
          <Text style={s.metricLabel}>{l.participants}</Text>
        </View>
        <View style={s.metricBox}>
          <Text style={[s.metricValue, { color: overallRate >= 80 ? COLORS.success : overallRate >= 50 ? COLORS.warning : COLORS.error }]}>{overallRate}%</Text>
          <Text style={s.metricLabel}>{l.overallAttendance}</Text>
        </View>
      </View>

      {/* Attendance trend bar chart */}
      {barData.length > 0 && (
        <>
          <Text style={s.subSectionTitle}>{l.attendanceTrend}</Text>
          <View style={s.chartContainer}>
            <BarChart data={barData} />
          </View>
          <View style={s.legendRow}>
            <View style={s.legendItem}><View style={[s.legendColor, { backgroundColor: COLORS.success }]} /><Text style={s.legendText}>≥80%</Text></View>
            <View style={s.legendItem}><View style={[s.legendColor, { backgroundColor: COLORS.warning }]} /><Text style={s.legendText}>50-79%</Text></View>
            <View style={s.legendItem}><View style={[s.legendColor, { backgroundColor: COLORS.error }]} /><Text style={s.legendText}>&lt;50%</Text></View>
          </View>
        </>
      )}

      {/* Attendance breakdown pie chart */}
      {totals.scheduled > 0 && (
        <>
          <Text style={[s.subSectionTitle, { marginTop: 16 }]}>{l.attendanceBreakdown}</Text>
          <PieChart slices={pieSlices} size={120} />
        </>
      )}

      <PageFooter l={l} projectTitle={data.project.title} />
    </Page>
  );
};

// ==============================|| LEARNING SUMMARY PAGE ||============================== //

const LearningSummaryPage = ({ data, l }) => {
  const allHighlights = data.dailyNotes.flatMap(n => n.keyHighlights || []);
  const allChallenges = data.dailyNotes.flatMap(n => n.challenges || []);

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>{l.learningSummary}</Text>

      <Text style={s.subSectionTitle}>{l.keyHighlights} ({allHighlights.length})</Text>
      {allHighlights.length === 0 ? (
        <Text style={{ fontSize: 9, color: COLORS.textSecondary, marginBottom: 8 }}>{l.noHighlights}</Text>
      ) : (
        allHighlights.map((h, i) => (
          <View key={i} style={s.bulletRow}>
            <View style={s.bulletDot} />
            <Text style={s.bulletText}>{h}</Text>
          </View>
        ))
      )}

      <Text style={[s.subSectionTitle, { marginTop: 16 }]}>{l.challenges} ({allChallenges.length})</Text>
      {allChallenges.length === 0 ? (
        <Text style={{ fontSize: 9, color: COLORS.textSecondary, marginBottom: 8 }}>{l.noChallenges}</Text>
      ) : (
        allChallenges.map((c, i) => (
          <View key={i} style={s.bulletRow}>
            <View style={s.challengeDot} />
            <Text style={s.bulletText}>{c}</Text>
          </View>
        ))
      )}

      <PageFooter l={l} projectTitle={data.project.title} />
    </Page>
  );
};

// ==============================|| PARKING LOT PAGE ||============================== //

const ParkingLotPage = ({ data, l }) => {
  const items = data.parkingLotItems || [];
  if (items.length === 0) {
    return (
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>{l.parkingLot}</Text>
        <Text style={{ fontSize: 9, color: COLORS.textSecondary }}>{l.noParkingLotItems}</Text>
        <PageFooter l={l} projectTitle={data.project.title} />
      </Page>
    );
  }

  const openCount = items.filter(i => i.status === 'open').length;
  const inProgressCount = items.filter(i => i.status === 'in_progress').length;
  const resolvedCount = items.filter(i => i.status === 'resolved').length;
  const highCount = items.filter(i => i.priority === 'high' && i.status !== 'resolved').length;

  const colWidths = { title: '40%', type: '12%', priority: '12%', status: '16%', days: '20%' };

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>{l.parkingLot}</Text>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}><Text style={s.statValue}>{items.length}</Text><Text style={s.statLabel}>{l.total} {l.items}</Text></View>
        <View style={s.statBox}><Text style={[s.statValue, { color: COLORS.warning }]}>{openCount}</Text><Text style={s.statLabel}>{l.open}</Text></View>
        <View style={s.statBox}><Text style={[s.statValue, { color: COLORS.primary }]}>{inProgressCount}</Text><Text style={s.statLabel}>{l.inProgress}</Text></View>
        <View style={s.statBox}><Text style={[s.statValue, { color: COLORS.success }]}>{resolvedCount}</Text><Text style={s.statLabel}>{l.resolved}</Text></View>
        <View style={s.statBox}><Text style={[s.statValue, { color: COLORS.error }]}>{highCount}</Text><Text style={s.statLabel}>{l.high} {l.priority}</Text></View>
      </View>

      {/* Table */}
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: colWidths.title }]}>{l.title}</Text>
        <Text style={[s.tableHeaderCell, { width: colWidths.type }]}>{l.type}</Text>
        <Text style={[s.tableHeaderCell, { width: colWidths.priority }]}>{l.priority}</Text>
        <Text style={[s.tableHeaderCell, { width: colWidths.status }]}>{l.status}</Text>
        <Text style={[s.tableHeaderCell, { width: colWidths.days }]}>{l.daysOpen}</Text>
      </View>
      {items.map((item, i) => {
        const daysOpen = item.solvedDate
          ? daysBetween(item.reportedDate, item.solvedDate)
          : daysBetween(item.reportedDate, new Date().toISOString());
        const statusLabel = item.status === 'open' ? l.open : item.status === 'in_progress' ? l.inProgress : l.resolved;
        const priorityLabel = item.priority === 'high' ? l.high : item.priority === 'medium' ? l.medium : l.low;
        const typeLabel = item.type === 'issue' ? l.issue : l.question;
        return (
          <View key={i} style={[s.tableRow, i % 2 === 0 ? { backgroundColor: COLORS.lightGrey } : {}]}>
            <Text style={[s.tableCell, { width: colWidths.title }]}>{item.title}</Text>
            <Text style={[s.tableCell, { width: colWidths.type }]}>{typeLabel}</Text>
            <Text style={[s.tableCell, { width: colWidths.priority }]}>{priorityLabel}</Text>
            <Text style={[s.tableCell, { width: colWidths.status }]}>{statusLabel}</Text>
            <Text style={[s.tableCell, { width: colWidths.days }]}>{daysOpen}d</Text>
          </View>
        );
      })}

      <PageFooter l={l} projectTitle={data.project.title} />
    </Page>
  );
};

// ==============================|| DAILY BREAKDOWN PAGES ||============================== //

const DailyBreakdownPages = ({ data, l, language }) => {
  const notes = data.dailyNotes || [];
  const attendanceMap = {};
  (data.attendance.byDate || []).forEach(d => { attendanceMap[d.date] = d; });

  if (notes.length === 0 && data.attendance.byDate.length === 0) {
    return (
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>{l.dailyBreakdown}</Text>
        <Text style={{ fontSize: 9, color: COLORS.textSecondary }}>{l.noNotes}</Text>
        <PageFooter l={l} projectTitle={data.project.title} />
      </Page>
    );
  }

  // Merge notes with attendance dates
  const allDates = new Set([
    ...notes.map(n => new Date(n.date).toISOString().split('T')[0]),
    ...data.attendance.byDate.map(d => d.date)
  ]);
  const sortedDates = Array.from(allDates).sort();

  const notesByDate = {};
  notes.forEach(n => { notesByDate[new Date(n.date).toISOString().split('T')[0]] = n; });

  return (
    <Page size="A4" style={s.page} wrap>
      <Text style={s.sectionTitle} fixed>{l.dailyBreakdown}</Text>

      {sortedDates.map((date, idx) => {
        const note = notesByDate[date];
        const att = attendanceMap[date];
        const attRate = att && att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : null;
        const sessionNotes = data.sessionNotesByDate?.[date];

        return (
          <View key={idx} style={s.dayCard} wrap={false}>
            <View style={s.dayHeader}>
              <Text style={s.dayDate}>{formatDate(date, language)}</Text>
              <View style={{ flexDirection: 'row' }}>
                {note?.author && <Text style={s.dayMeta}>{note.author}</Text>}
                {attRate !== null && (
                  <Text style={[s.dayMeta, { marginLeft: 12, color: attRate >= 80 ? COLORS.success : COLORS.warning }]}>
                    {l.overallAttendance}: {attRate}% ({att.present + att.late}/{att.total})
                  </Text>
                )}
              </View>
            </View>

            {/* Highlights */}
            {note?.keyHighlights?.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.success, marginBottom: 2 }}>{l.keyHighlights}</Text>
                {note.keyHighlights.map((h, i) => (
                  <View key={i} style={s.bulletRow}><View style={s.bulletDot} /><Text style={s.bulletText}>{h}</Text></View>
                ))}
              </>
            )}

            {/* Challenges */}
            {note?.challenges?.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.warning, marginBottom: 2, marginTop: 4 }}>{l.challenges}</Text>
                {note.challenges.map((c, i) => (
                  <View key={i} style={s.bulletRow}><View style={s.challengeDot} /><Text style={s.bulletText}>{c}</Text></View>
                ))}
              </>
            )}

            {/* Session notes (abbreviated) */}
            {sessionNotes && sessionNotes.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 2, marginTop: 4 }}>{l.sessionNotes}</Text>
                <View style={s.sessionNotesBox}>
                  <Text style={s.sessionNotesText}>
                    {sessionNotes.join('\n\n').substring(0, 600)}{sessionNotes.join('\n\n').length > 600 ? '...' : ''}
                  </Text>
                </View>
              </>
            )}
          </View>
        );
      })}

      <PageFooter l={l} projectTitle={data.project.title} />
    </Page>
  );
};

// ==============================|| MAIN DOCUMENT ||============================== //

const TrainingReportPDF = ({ data, language = 'en' }) => {
  const l = labels[language] || labels.en;

  return (
    <Document title={`${data.project.title} - ${l.trainingReport}`} author={data.organization?.title || 'EDWIND'}>
      <CoverPage data={data} l={l} language={language} />
      <ExecutiveSummaryPage data={data} l={l} language={language} />
      <LearningSummaryPage data={data} l={l} />
      <ParkingLotPage data={data} l={l} />
      <DailyBreakdownPages data={data} l={l} language={language} />
    </Document>
  );
};

export default TrainingReportPDF;
