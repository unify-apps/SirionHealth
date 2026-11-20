// @ts-nocheck
/* Mock account packs: invented data for two more account pages, shaped like TransAmerica's real fixtures in legacy.js.
   Each pack varies the story so the detail page shows other states:
   - Abellio: renewal overdue and unsigned, no cap, short and sparse history (scored from Jan 2026), many inputs with
     no data, no executive sponsor, champion gone, no public news, a single order form.
   - Boston Scientific: 18 months sliding from 85 to 33, no cap, auto-renew on, renewal beyond 90 days, P1 incidents
     and escalations, an engaged but unhappy sponsor, many people, rich news. */

export const MOCK_ACCOUNTS = {
  abellio: {
    name: 'Abellio', ind: 'Transportation', seg: 'Enterprise', region: 'Europe', stage: 'BAU',
    customer: /Abellio/, sponsorEmail: null, sponsorNote: '',
    record: {
      snapshot: '2026-10-31', scoredOn: '2026-11-18',
      finalHealth: 43, weightedHealth: 43, band: 'AMBER', overrideReason: '', overrideCode: '',
      renewal: '2026-09-30', autoRenew: false, signedCommitment: false, tfc: true,
      carr: 121300, nrr: 100, grr: 100, expansion: 0,
      kpis: {
        commercial: [['Renewal proximity', 'renewalProximityHealth', 0, 'Renewal 31 days overdue at snapshot'], ['Open invoices', 'openInvoicesHealth', 60, '1 invoice 45 days overdue'], ['Expansion (upsell)', 'expansionArrHealth', -1, 'No expansion opportunity']],
        adoption: [['Monthly active users', 'mauHealth', 12, '4 users (12-mo avg 19)'], ['Licence use', 'licenceUtilisationHealth', 3, '4 of 300 seats'], ['Contract volume', 'contractVolumeHealth', -1, 'No contracts processed, not scored'], ['Active workflows', 'activeWorkflowsHealth', 20, '1 approval cycle closed (12-mo avg 5)'], ['Time to first value', 'timeToFirstValueHealth', -1, 'Go-live date not recorded']],
        support: [['SLA compliance', 'slaComplianceHealth', 100, 'Both tickets inside SLA'], ['Ticket reopen rate', 'reopenRateHealth', 100, '0 reopened'], ['Tickets created', 'ticketsCreatedHealth', 95, '2 this month (12-mo avg 3)'], ['Enhancement request age', 'jiraAvgAgeHealth', -1, 'No open Jira'], ['Critical incidents', 'criticalIncidentCountHealth', -1, '0 counted, not scored']],
        engagement: [['Executive sponsor engagement', 'execEngagementHealth', -1, 'No executive sponsor tagged'], ['Champion stability', 'championDepartureHealth', 0, 'Champion left on Aug 15'], ['CSM touchpoints', 'csmTouchpointsHealth', 35, '2 this month (12-mo avg 9)'], ['Onboarding completion', 'onboardingCompletionHealth', 64, 'LMS 64%']],
        sentiment: [['Communication sentiment trend', 'sentimentHealth', 38, 'From 6 emails this month'], ['Support ticket sentiment', 'supportTicketSentimentHealth', -1, 'No ticket sentiment scored'], ['Escalations', 'execEscalationsHealth', -1, '0 exec escalations, not scored']],
        renewalRisk: [['Expansion signed', 'expansionArrHealth', -1, 'No expansion opportunity']],
      },
      emailsThisMonth: 6, openJira: 0, perAging: 0, approvalCycles: [5, 1],
    },
    facts: {
      licence: { pct: 1, used: 4, bought: 300 }, mau: [4, 19], onboarding: 64, contracts: [0, 3], approvals: [1, 5], sla: 100, reopen: 0,
      orderForms: [{ id: 'AB0412 OF 001', value: 121.3 }],
      repository: [156, 41], priority: [0, 1, 4, 9], themeCount: 3, ticketsThisMonth: 2,
      tickets: 'P1 0, P2 1, P3 4, P4 9', exec: 'No executive sponsor is tagged. CSM touchpoints 2 (12-month average 9).',
    },
    monthly: [
      ['2026-01', 71, 100, 62, 95, 80, 70, 0], ['2026-02', 68, 100, 55, 96, 78, 66, 0], ['2026-03', 66, 100, 48, 92, 75, 64, 0],
      ['2026-04', 63, 100, 41, 98, 72, 60, 0], ['2026-05', 61, 100, 35, 97, 70, 58, 0], ['2026-06', 58, 95, 30, 99, 64, 55, 0],
      ['2026-07', 55, 90, 26, 98, 58, 51, 0], ['2026-08', 49, 80, 20, 97, 36, 46, 0], ['2026-09', 47, 70, 17, 99, 33, 42, 0],
      ['2026-10', 43, 30, 15, 98, 30, 38, 0],
    ],
    sentiment: [
      ['2026-10', '', 'On October 9 Femke de Vries asked again for the renewal quote in euros; the September quote was in pounds. On October 22 Tom Hughes said the renewal is on hold until the rail franchise decision in December.'],
      ['2026-09', 'On September 4 Femke de Vries joined a one-hour admin refresher and said the new intake form was easier.', 'On September 30 the contract reached its renewal date unsigned. Tom Hughes said budget for 2027 is not yet approved.'],
      ['2026-08', '', 'Champion Priya Shah left Abellio on August 15 and no handover was arranged. On August 20 Tom Hughes declined the quarterly business review.'],
    ],
    contacts: [
      ['Hughes, Tom', 'Head of Procurement', 'tom.hughes@abellio.co.uk', '', 'Outlook'],
      ['Femke de Vries', 'Contract Manager', 'femke.devries@abellio.co.uk', '', 'Outlook+Freshservice'],
      ['Priya Shah', 'Legal Counsel', 'priya.shah@abellio.co.uk', 'Former champion', 'Outlook'],
      ['noreply', '', 'noreply@abellio.co.uk', '', 'Outlook'],
      ['Shreya Dubey', '', 'shreya.dubey@unifyapps.com', '', 'Outlook'],
    ],
    org: { 'abellio.co.uk': 'Abellio', 'unifyapps.com': 'UnifyApps (internal)' },
    suggest: {
      'priya.shah@abellio.co.uk': ['Left the role', 'Left Abellio on Aug 15, 2026 with no handover.'],
      'tom.hughes@abellio.co.uk': ['Decision maker, budget owner', 'Holds the 2027 budget; declined the Aug QBR and put the renewal on hold on Oct 22.'],
      'femke.devries@abellio.co.uk': ['Key user, likely new champion', 'The only customer user named since August; asked twice for the renewal quote.'],
    },
    events: [
      ['2026-06-30', 'flag', 'Health fell under 60 for the first time', 'AHI record Jun 30'],
      ['2026-08-15', 'neg', 'Champion Priya Shah left Abellio', 'sentiment Aug 2026'],
      ['2026-08-20', 'neg', 'Tom Hughes declined the quarterly business review', 'sentiment Aug 2026'],
      ['2026-09-04', 'pos', 'Femke de Vries joined the admin refresher', 'sentiment Sep 2026'],
      ['2026-09-30', 'end', 'Renewal date passed unsigned: $121.3K CARR', 'order forms'],
      ['2026-10-09', 'neu', 'Last meeting', 'engagement snapshot'],
      ['2026-10-22', 'neg', 'Renewal put on hold until the franchise decision', 'sentiment Oct 2026'],
      ['2026-10-24', 'neu', 'Last email', 'engagement snapshot'],
      ['2026-11-28', 'goal', 'Commitment target: euro quote signed', 'AI insight (suggested)'],
    ],
    newsPeople: [],
    T: {
      adopt: [['Peak monthly users', '31', '58 users ever active'], ['Licence use', '1%', '4 of 300 seats'], ['Onboarding', '64%', 'LMS completion'], ['Contracts processed', '0', 'this month · 12-mo avg 3'], ['Approval cycles closed', '1', 'this month · 12-mo avg 5'], ['Time to go-live', 'No data', '']],
      support: [['Tickets', '14', 'lifetime'], ['SLA met', '100%', ''], ['P1 incidents', '0', ''], ['Exec escalations', '0', ''], ['Reopen rate', '0%', ''], ['Open enhancement requests', '0', '']],
      themes: [['User access', 6], ['Metadata & tabs', 5], ['Integration', 3]],
      market: [],
    },
    copy: {
      keyCopy: {
        '2026-06-30': ['Health under 60', 'First month under 60 · health record, Jun 30'],
        '2026-09-30': ['Renewal date passed · $121.3K CARR', '1 order form, unsigned, auto-renew off'],
        '2026-11-28': ['Commitment target date', 'Suggested by the account insight: get the euro quote signed'],
      },
      insight: '“Within 9 days, send the renewal quote in euros to Femke de Vries and agree a signature path with Tom Hughes; the contract has run 50 days past its Sep 30, 2026 renewal date.”',
      brief: [
        ['Where we stand', 'The contract ran past its renewal on Sep 30 unsigned, and almost nobody uses the product: 4 of 300 seats {adopt}.'],
        ['Next', 'Send the renewal quote in euros by Nov 28 {insight}. Femke de Vries is the likely new champion {lead}.'],
        ['At stake', 'The champion left in August with no handover {handover}, and procurement has put the renewal on hold {hold}.'],
      ],
      well: [
        ['Support is quiet and on time', 'Both tickets this month closed inside SLA and none reopened {sup}.', '100% SLA', 'support'],
        ['One active user is engaged', 'Femke de Vries joined the admin refresher and liked the new intake form {lead}.', '1 active user', 'engagement'],
      ],
      attn: [
        ['Renewal is overdue', 'The contract passed its Sep 30 renewal date with nothing signed and an invoice 45 days overdue {renew}.', '50 days late', 'commercial'],
        ['Almost nobody logs in', 'Licence use is 1% and monthly users fell to 4 against an average of 19 {adopt}.', '1% licence use', 'adoption'],
        ['No sponsor and no champion', 'No executive sponsor is tagged and the champion left on Aug 15 {exec}.', '0 sponsors', 'engagement'],
      ],
      refs: { lead: { kind: 'person', email: 'femke.devries@abellio.co.uk' }, handover: { kind: 'ev', match: 'left Abellio' }, hold: { kind: 'ev', match: 'renewal is on hold' } },
      cause: { engagement: 'Champion left', adoption: 'Licence use at 1%' },
    },
  },

  boston: {
    name: 'Boston Scientific', ind: 'Manufacturing', seg: 'Enterprise', region: 'North America', stage: 'BAU + Implementation',
    customer: /Boston Scientific/, sponsorEmail: 'mark.ellison@bsci.com', sponsorNote: '2 executive escalations this month',
    record: {
      snapshot: '2026-10-31', scoredOn: '2026-11-18',
      finalHealth: 33, weightedHealth: 33, band: 'RED', overrideReason: '', overrideCode: '',
      renewal: '2027-02-28', autoRenew: true, signedCommitment: false, tfc: false,
      carr: 597500, nrr: 100, grr: 100, expansion: 150000,
      kpis: {
        commercial: [['Renewal proximity', 'renewalProximityHealth', 72, 'Renewal in 120 days at snapshot'], ['Open invoices', 'openInvoicesHealth', 20, '3 invoices over 60 days ($212K)'], ['Expansion (upsell)', 'expansionArrHealth', 0, '$150K open, paused by the customer']],
        adoption: [['Monthly active users', 'mauHealth', 41, '1180 users (12-mo avg 1640)'], ['Licence use', 'licenceUtilisationHealth', 4, '96 of 4,800 new-module seats'], ['Contract volume', 'contractVolumeHealth', 55, '1,204 processed (12-mo avg 1,580)'], ['Active workflows', 'activeWorkflowsHealth', 38, '41 approval cycles closed (12-mo avg 88)'], ['Time to first value', 'timeToFirstValueHealth', 10, 'Go-live 7 months late']],
        support: [['SLA compliance', 'slaComplianceHealth', 22, '58% inside SLA'], ['Ticket reopen rate', 'reopenRateHealth', 30, '14 reopened'], ['Tickets created', 'ticketsCreatedHealth', 8, '96 this month (12-mo avg 41)'], ['Enhancement request age', 'jiraAvgAgeHealth', 45, '118 days, 27 open Jira (12-mo avg 96)'], ['Critical incidents', 'criticalIncidentCountHealth', 0, '3 P1 incidents this month']],
        engagement: [['Executive sponsor engagement', 'execEngagementHealth', 70, '4 this month (12-mo avg 3)'], ['Champion stability', 'championDepartureHealth', 100, 'Both champions in place'], ['CSM touchpoints', 'csmTouchpointsHealth', 88, '31 this month (12-mo avg 24)'], ['Onboarding completion', 'onboardingCompletionHealth', 22, 'LMS 22% for the new module']],
        sentiment: [['Communication sentiment trend', 'sentimentHealth', 12, 'From 212 emails this month'], ['Support ticket sentiment', 'supportTicketSentimentHealth', 18, '96 tickets, mostly negative'], ['Escalations', 'execEscalationsHealth', 0, '2 exec escalations this month']],
        renewalRisk: [['Expansion signed', 'expansionArrHealth', 0, '$150K expansion paused']],
      },
      emailsThisMonth: 212, openJira: 27, perAging: 118, approvalCycles: [88, 41],
    },
    facts: {
      licence: { pct: 2, used: 96, bought: 4800 }, mau: [1180, 1640], onboarding: 22, contracts: [1204, 1580], approvals: [41, 88], sla: 58, reopen: 15,
      orderForms: [{ id: 'BS0177 OF 001', value: 412.5 }, { id: 'BS0177 OF 002', value: 120 }, { id: 'BS0177 OF 003', value: 65 }],
      repository: [19970, 8412], priority: [9, 61, 212, 340], themeCount: 14, ticketsThisMonth: 96,
      tickets: 'P1 9, P2 61, P3 212, P4 340', exec: 'Executive sponsor engagement 4 this month (12-month average 3). CSM touchpoints 31 (12-month average 24).',
    },
    monthly: [
      ['2025-05', 84, 100, 90, 82, 90, 72, 0], ['2025-06', 85, 100, 91, 84, 92, 74, 0], ['2025-07', 83, 100, 92, 80, 90, 71, 0],
      ['2025-08', 86, 100, 93, 85, 94, 75, 0], ['2025-09', 84, 100, 92, 83, 91, 73, 0], ['2025-10', 82, 100, 90, 80, 90, 70, 0],
      ['2025-11', 81, 100, 88, 78, 92, 69, 0], ['2025-12', 80, 100, 87, 79, 90, 68, 0], ['2026-01', 78, 100, 85, 74, 91, 66, 0],
      ['2026-02', 79, 100, 84, 76, 93, 67, 0], ['2026-03', 77, 100, 80, 72, 94, 64, 0], ['2026-04', 74, 95, 76, 66, 95, 58, 0],
      ['2026-05', 68, 90, 70, 52, 92, 49, 0], ['2026-06', 61, 85, 62, 41, 90, 40, 0], ['2026-07', 55, 80, 55, 33, 88, 31, 0],
      ['2026-08', 47, 70, 50, 24, 86, 22, 0], ['2026-09', 39, 52, 44, 16, 80, 15, 0], ['2026-10', 33, 31, 41, 14, 80, 12, 0],
    ],
    sentiment: [
      ['2026-10', 'On October 14 Dana Whitfield thanked the team for the weekend hotfix on INC-201884.', 'On October 3 Mark Ellison sent an escalation on three P1 outages, INC-201884, INC-202115 and INC-202340, to Sirion leadership. On October 20 Dana Whitfield said the go-live slip is now a board-level issue. On October 28 procurement paused the $150K expansion until a remediation plan is agreed.'],
      ['2026-09', 'On September 12 Jordan Reyes confirmed the integration test environment is stable again.', 'On September 5 Mark Ellison asked for a written remediation plan within two weeks. On September 18 users reported search errors in the repository on INC-199402. On September 25 Dana Whitfield said the team is still chasing three overdue fixes.'],
      ['2026-08', 'On August 7 Jordan Reyes praised the new intake form during the QBR.', 'On August 21 the go-live for the new module slipped a second time. On August 26 Aisha Karim reported that approvals were blocked on INC-197750.'],
      ['2026-07', 'On July 9 Mark Ellison attended the executive business review and agreed the rollout plan.', 'On July 23 Dana Whitfield raised slow page loads in the repository on SR-196021.'],
      ['2026-06', 'On June 4 Jordan Reyes completed admin certification. On June 18 Aisha Karim joined as a second champion for the Galway site.', 'On June 26 a data migration failure left 1,200 legacy contracts out of the repository on INC-195300.'],
      ['2026-05', 'On May 14 the quarterly business review closed with a signed rollout plan.', 'On May 29 Dana Whitfield asked for a dedicated support engineer.'],
    ],
    contacts: [
      ['Mark Ellison', 'SVP, Global Procurement', 'mark.ellison@bsci.com', 'Executive sponsor', 'Calendar+Outlook'],
      ['Dana Whitfield', 'Director, Contract Operations', 'dana.whitfield@bsci.com', 'Champion', 'Calendar+Outlook'],
      ['Aisha Karim', 'Senior Manager, Legal Operations', 'aisha.karim@bsci.com', 'Champion', 'Outlook'],
      ['Jordan Reyes', 'CLM Platform Lead', 'jordan.reyes@bsci.com', '', 'Outlook+Freshservice'],
      ['Priyanka Menon', 'IT Security Analyst', 'priyanka.menon@bsci.com', '', 'Freshservice'],
      ['Ken Lu', 'Procurement Analyst', 'ken.lu@bsci.com', '', 'Calendar'],
      ["Sarah O'Neil", '', 'sarah.oneil@bsci.com', '', 'Outlook'],
      ['noreply', '', 'no-reply@bsci.com', '', 'Outlook'],
      ['Shreya Dubey', '', 'shreya.dubey@unifyapps.com', '', 'Outlook'],
      ['Marco Bianchi', 'Implementation Lead', 'marco.bianchi@accenture.com', '', 'Outlook+Calendar'],
    ],
    org: { 'bsci.com': 'Boston Scientific', 'unifyapps.com': 'UnifyApps (internal)', 'accenture.com': 'Accenture (partner)' },
    suggest: {
      'jordan.reyes@bsci.com': ['Technical owner, platform', 'Owns the integration test environment and the new-module rollout; certified admin since Jun 4.'],
      'priyanka.menon@bsci.com': ['IT and security contact', 'Raises the access and SSO tickets in Freshservice.'],
    },
    events: [
      ['2026-05-14', 'pos', 'QBR closed with a signed rollout plan', 'sentiment May 2026'],
      ['2026-05-31', 'flag', 'Health under 70: Watch', 'AHI record May 31'],
      ['2026-06-26', 'neg', 'Data migration failure on 1,200 legacy contracts', 'sentiment Jun 2026'],
      ['2026-07-09', 'pos', 'Executive business review agreed the rollout plan', 'sentiment Jul 2026'],
      ['2026-08-21', 'neg', 'New-module go-live slipped a second time', 'sentiment Aug 2026'],
      ['2026-09-05', 'neg', 'Mark Ellison asked for a written remediation plan', 'sentiment Sep 2026'],
      ['2026-09-30', 'flag', 'Health under 40: At risk', 'AHI record Sep 30'],
      ['2026-10-03', 'neg', 'Escalation on three P1 outages', 'sentiment Oct 2026'],
      ['2026-10-28', 'neg', 'Procurement paused the $150K expansion', 'sentiment Oct 2026'],
      ['2026-11-14', 'neu', 'Last meeting', 'engagement snapshot'],
      ['2026-11-18', 'neu', 'Last email', 'engagement snapshot'],
      ['2026-12-05', 'goal', 'Commitment target: remediation plan signed off', 'AI insight (suggested)'],
      ['2027-02-28', 'end', 'Renewal: $597.5K CARR, 3 order forms', 'order forms'],
    ],
    newsPeople: [
      { name: 'Linda Park', title: 'Chief Procurement Officer', org: 'Boston Scientific', suggested: 'Sponsor',
        basis: "Named Chief Procurement Officer on Aug 12, 2026, joining from Medtronic. Not in AHI's contacts and never named in a monthly summary.", source: 'Public news, Aug 12, 2026' },
    ],
    T: {
      adopt: [['Peak monthly users', '1,920', '6,300 users ever active'], ['Licence use', '2%', '96 of 4,800 new-module seats'], ['Onboarding', '22%', 'LMS completion, new module'], ['Contracts processed', '1,204', 'this month · 12-mo avg 1,580'], ['Approval cycles closed', '41', 'this month · 12-mo avg 88'], ['Time to go-live', '398 days', '7 months late']],
      support: [['Tickets', '622', 'lifetime'], ['SLA met', '58%', ''], ['P1 incidents', '9', '3 this month'], ['Exec escalations', '2', 'this month'], ['Reopen rate', '15%', ''], ['Open enhancement requests', '27', 'avg age 118 days']],
      themes: [['Performance', 118], ['Search', 96], ['Data migration', 88], ['Integration', 74], ['Workflow', 61], ['User access', 52], ['Reporting', 40], ['Notifications', 33]],
      market: [
        ['Executive leadership', 70, 'Aug 12: Boston Scientific named Linda Park, formerly of Medtronic, as Chief Procurement Officer.', 'A new CPO often reviews tooling in the first six months. Brief her before the February renewal.'],
        ['Corporate and regulatory', 55, 'Sep 30: FDA warning letter on a cardiac device line. Oct 15: EU MDR recertification deadline extended.', 'More obligation tracking for quality agreements; a reason to keep the repository live.'],
        ['Financial and operational', 80, 'Jul 24: Q2 results beat estimates and a cost programme targets $400M in savings. Oct 22: hiring freeze across G&A functions.', 'Savings targets put a $597.5K tool under review; tie the renewal to measured savings.'],
        ['Security and incidents', null, 'No events found this year.', ''],
        ['Procurement and legal tech', 60, 'Jun 10: the legal team piloted an AI contract-review tool from a competitor.', 'Competitive risk: the pilot overlaps with the new module that has not gone live.'],
      ],
    },
    copy: {
      keyCopy: {
        '2026-05-31': ['Health under 70', 'Watch from May · health record, May 31'],
        '2026-09-30': ['Health under 40', 'At risk from September · health record, Sep 30'],
        '2027-02-28': ['Renewal due · $597.5K CARR', '3 order forms, auto-renew on'],
        '2026-12-05': ['Commitment target date', 'Suggested by the account insight: get the remediation plan signed off'],
      },
      insight: '“Within 16 days, agree a written remediation plan for the three P1 outages with Mark Ellison and Dana Whitfield, then restart the paused $150K expansion before the Feb 28, 2027 renewal (101 days remaining).”',
      brief: [
        ['Where we stand', 'Health slid from 86 to 33 over six months as the new-module rollout stalled and P1 outages piled up {sup}.'],
        ['Next', 'Get the remediation plan signed off by Dec 5 {insight}. Jordan Reyes owns the rollout on their side {lead}.'],
        ['At stake', 'The sponsor escalated three P1 outages {threat} and procurement paused the $150K expansion {hold}.'],
      ],
      well: [
        ['Executives are in the room', 'Executive sponsor engagement is 4 this month, above its average of 3, and CSM touchpoints rose to 31 {exec}.', '4 exec contacts', 'engagement'],
        ['Champions are in place', 'Dana Whitfield and Aisha Karim are both active and named this quarter {lead}.', '2 champions', 'engagement'],
      ],
      attn: [
        ['Three P1 outages this month', 'SLA compliance fell to 58% and 14 tickets reopened; the sponsor sent an escalation on Oct 3 {sup}.', '58% SLA', 'support'],
        ['The new module never went live', 'Go-live is 7 months late: 96 of 4,800 new seats are in use and 22% have finished onboarding {adopt}.', '2% licence use', 'adoption'],
        ['Invoices are overdue', 'Three invoices worth $212K are more than 60 days overdue, and the $150K expansion is paused {comm}.', '$212K overdue', 'commercial'],
        ['Workflows have slowed', 'Approval cycles closed fell from 88 to 41 and contract volume is 24% below average {approvals}.', '41 cycles', 'adoption'],
      ],
      refs: { lead: { kind: 'person', email: 'jordan.reyes@bsci.com' }, threat: { kind: 'ev', match: 'escalation on three P1' }, hold: { kind: 'ev', match: 'paused the $150K' } },
      cause: { support: '3 P1 outages this month', sentiment: 'Sponsor escalation on Oct 3' },
    },
  },
}

/** Which account the detail page shows, picked once per page load: `?acct=` in the hash wins, else the last one opened
 *  in this tab, else TransAmerica. Switching accounts reloads the page so every module reads the new pack. */
export const ACCOUNT_ID = (() => {
  try {
    const q = new URLSearchParams(location.hash.split('?')[1] || '').get('acct')
    if (q && (q === 'ta' || MOCK_ACCOUNTS[q])) { sessionStorage.setItem('sah-account', q); return q }
    const s = sessionStorage.getItem('sah-account')
    return s && MOCK_ACCOUNTS[s] ? s : 'ta'
  } catch { return 'ta' }
})()
