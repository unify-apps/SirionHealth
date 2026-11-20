/* data.js: fixtures captured from the live AHI tenant on 19 Nov 2026. Customer data: keep the repo private. */
const TODAY = new Date(2026,10,19);
// 25 real rows from the live AHI account list (ahiDashboardTable), 19 Nov 2026
const ROWS = [
 ["ACT Commodities Group B.V.","Consulting","SMB","Implementation",52,175.9,null,null,0,"2029-05-31",0],
 ["AIA","Insurance","Enterprise","BAU",62,180,94,94,4500,"2029-07-31",15],
 ["ASM","Manufacturing","Enterprise","Implementation",79,240,120,100,526,"2030-09-29",15],
 ["AT&S","Manufacturing","Enterprise","Implementation",65,189,100,100,0,"2031-01-31",0],
 ["ATO","Government","Enterprise","BAU",49,550,100,100,28,"2028-04-30",22],
 ["AbbVie","Health & Life Science","Enterprise","BAU",42,251.3,45,45,162324,"2027-06-30",18],
 ["Abellio","Transportation","Enterprise","BAU",43,121.3,100,100,156,"2026-09-30",1],
 ["Achmea","Financial services","Enterprise","Implementation",77,405.2,100,100,0,"2028-11-29",0],
 ["Al Ghurair Investments","Food & beverage","Enterprise","Implementation",56,95,null,null,30,"2031-06-09",37],
 ["Allego","Automotive","SMB","BAU",62,89,100,100,1040,"2029-09-30",8],
 ["Almarai","Food & beverage","Enterprise","Implementation",72,90,100,100,618,"2028-06-29",14],
 ["Altria","Consumer goods","Enterprise","BAU",62,196.5,106,100,37584,"2027-09-10",46],
 ["American Equity","Financial services","Enterprise","BAU",44,126,100,100,4114,"2027-04-28",1],
 ["Amgen","Health & Life Science","Enterprise","BAU",48,1400,100,100,73640,"2028-03-30",3],
 ["Amprion","Energy & utilities","Enterprise","Implementation",74,689.1,100,100,6030,"2028-02-29",0],
 ["Amrest","Food & beverage","Enterprise","BAU",62,218.7,109,100,6520,"2029-08-31",16],
 ["Apollo","Financial services","Enterprise","BAU",35,231.3,103,100,0,"2027-08-18",null],
 ["Asian Paints","Manufacturing","Enterprise","BAU",66,150.5,100,100,27142,"2027-02-28",46],
 ["Axia Women's Health","Health & Life Science","SMB","Churned this FY",1,0,0,0,1878,"2027-03-22",null],
 ["Bayer AG","Health & Life Science","Enterprise","Implementation",81,1500,107,100,94,"2027-12-15",0],
 ["Boston Scientific","Manufacturing","Enterprise","BAU + Implementation",33,597.5,100,100,19970,"2027-02-28",2],
 ["Breitling","Manufacturing","Enterprise","BAU",46,42.1,100,100,1860,"2028-04-14",19],
 ["Ashurst","Consulting","Mid market","BAU + Implementation",67,404.4,100,100,1584,"2027-03-08",null],
 ["Avista Corporation","Energy & utilities","Enterprise","BAU",70,191,100,100,36060,"2029-09-30",45],
 ["TransAmerica","Financial services","Enterprise","BAU",50,330,100,100,3461,"2026-12-30",111]
].map(r=>({name:r[0],ind:r[1],seg:r[2],stage:r[3],health:r[4],carr:r[5],nrr:r[6],grr:r[7],repo:r[8],renew:new Date(r[9]+"T00:00:00"),lic:r[10]}));

const T = {
  trend:[82,82,82,78,77,83,75,78,71,64,79,80,72,77,65,67,73,50],
  months:["May 25","Jun 25","Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25","Jan 26","Feb 26","Mar 26","Apr 26","May 26","Jun 26","Jul 26","Aug 26","Sep 26","Oct 26"],
  kpis:[["CARR","$330K","2 order forms"],["NRR","100%","GRR 100%"],["Monthly active users","222","12-mo avg 215"],["Licence use","111%","663 of 593 seats"],["Repository","3,461","contracts"],["Expansion","$85K","open pipeline"],["Open Jira tickets","11","PER age 423 days"]],
  dims:[
    ["Product adoption",75,"Active users 80 · licence use 100 · contract volume 62"],
    ["Support and enhancement requests",72,"Enhancement request age 423 days scores 16 · SLA compliance no data"],
    ["Commercial",69,"Renewal proximity 39 · invoices current 100"],
    ["Customer engagement",56,"Onboarding 97 · CSM touchpoints 15 · executive sponsor no data"],
    ["Sentiment",50,"Communication trend 50 · ticket sentiment no data"],
    ["Renewal risk",0,"No expansion signed"]],
  actions:[
    ["Get a signed renewal commitment","$330K renews Dec 30 and auto-renew is off.","Due Nov 26","bad"],
    ["Re-engage Lawrence Kane","Tagged executive sponsor; no executive touchpoints in 12 months.","Due Dec 3","warn"],
    ["Name a new champion","Bailey Laske handed over her role on Oct 21.","Due Dec 3","warn"],
    ["Clear the support backlog","11 open Jira tickets; enhancement requests aging 423 days.","Due Dec 3","warn"]],
  people:[
    ["LK","Lawrence Kane","Head of Enterprise Procurement","Executive sponsor","No contact in 12 mo","bad"],
    ["KB","Karen Ben-Alta","Director, External Workforce & Procurement Ops","Champion","Calendar, email",""],
    ["AD","Adrian Dragomir","Director, Strategic Procurement","Champion","Calendar, email",""],
    ["NC","Nick Cavazos","Most active contact","Key user","Email Oct 7",""],
    ["BL","Bailey Laske","Former champion","Handed over","Oct 21","warn"]],
  engage:[["Meetings","276",""],["Emails","1,040",""],["Last meeting","Nov 12",""],["Last email","Nov 16",""],["Onboarding","97%","LMS completion"],["Time to go-live","241 days",""]],
  adopt:[["Peak monthly users","255","600 users ever active"],["Licence use","111%","663 of 593 seats"],["Onboarding","97.4%","LMS completion"],["Contracts processed","155","this month · 12-mo avg 171"],["Approval cycles closed","0","this month · 12-mo avg 12"],["Time to go-live","241 days",""]],
  support:[["Tickets","126","lifetime"],["SLA met","95%",""],["P1 incidents","0",""],["Exec escalations","0",""],["Reopen rate","2%",""],["Open enhancement requests","11","avg age 423 days"]],
  themes:[["Workflow",51],["Metadata & tabs",18],["System notifications",12],["Integration",8],["User access",6],["System platform",6],["Decision tables",5],["Query & data",4]],
  sent:{
    Oct:["Nick Cavazos thanked the team on Oct 7 after SR-179243 (ARB approval) was resolved. On Oct 27 Callie Borders confirmed Transamerica will keep the new Early Engagement workflow step.","Champion Bailey Laske handed over her role on Oct 21, after chasing the RCA for INC-177010 on Oct 15. Nick Cavazos asked on Oct 6 to keep INC-172670 moving."],
    Sep:["Nick Cavazos introduced Amanda Urbancic for system administration on Sep 2 and asked for CLM admin certification. He accepted the monthly business review on Sep 9.","Bailey Laske called INC-172670 urgent on Sep 1. On Sep 24 the customer asked for advance notice of host-key changes."],
    Aug:["Executive MBR minutes set action items for the Sep 3 weekly catch-up. Ariba Doc ID integration sessions continued on Aug 17.","Leadership threatened the renewal on Aug 28 and asked about proactive monitoring. Missing notifications on CDR05033 and CDR05034 were escalated on Aug 27."]},
  contacts:[["Lawrence Kane","Executive sponsor","Head of Enterprise Procurement","Calendar, Outlook"],["Karen Ben-Alta","Champion","Director, External Workforce & Procurement Ops","Calendar, Outlook"],["Adrian Dragomir","Champion","Director, Strategic Procurement & Category Mgmt","Calendar, Outlook"],["Nick Cavazos","Key user","","Calendar, Outlook"],["Callie Borders","Key user","","Outlook"],["Bailey Laske","Former champion","","Outlook, Freshservice"],["Tawana Perez","","","Freshservice"],["Stephanie Legislador","","","Calendar"]],
  market:[
    ["Executive leadership",65,"Mar 1: Jay Orlandi named EVP and Chief Legal & Corporate Affairs Officer, now overseeing Procurement.","Your buying centre reports to a new executive. Book an introduction before the renewal."],
    ["Corporate and regulatory",40,"Sep 29: $73.75M class-action settlement on cost-of-insurance rate increases. Sep 7: $110M settlement fund for universal life policies.","More pressure on obligation tracking; a fit for automated obligation management."],
    ["Financial and operational",75,"Oct 8: Aegon shareholders approved the move to the US as Transamerica Inc. Nov 12: payroll modernisation deal with Congruent Solutions.","Entity changes may need contract novation across suppliers."],
    ["Security and incidents",70,"Nov 4: German prosecutors raided offices linked to the sale of the Transamerica Pyramid.","Raises vendor-risk governance requirements."],
    ["Procurement and legal tech",null,"No events found this year.",""]]
};
const P = {
  pods:[["CS – NA",99,40.1,57,13,1.4,9,1.8],["Eigen",12,1.9,24,11,1.6,2,.4233],["CS – AMEA",41,13.6,53,10,1.3,1,.2],["CS – Europe",96,35.3,62,9,.8167,4,.7661],["Strategic Accounts",2,12.7,65,0,0,0,0],["Unassigned",10,0,null,10,0,0,0]],
  stages:[["BAU + Implementation",44.8],["BAU",29.9],["Implementation",26.2],["Pending kick-off",2.4],["Expected churn",0.3],["Churned",0]],
  grr:[["Under 90%",14,"var(--bad)"],["90 to 99%",2,"var(--warn)"],["100% or more",221,"var(--good)"]]
};

