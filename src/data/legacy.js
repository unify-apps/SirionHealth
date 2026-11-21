// @ts-nocheck
/* Generated from legacy/src/{data,data-ta,ta,lib}.js by tools/port-data.sh — fixtures captured from the live AHI tenant, 19 Nov 2026. Customer data: keep the repo private. */
/* data.js: fixtures captured from the live AHI tenant on 19 Nov 2026. Customer data: keep the repo private. */
import { ACCOUNT_ID, MOCK_ACCOUNTS } from './mock-accounts.js';
const TODAY = new Date(2026,10,19);
// 25 real rows from the live AHI account list (ahiDashboardTable), 19 Nov 2026
// prototype: AbbVie, ATO (health) and American Equity, Altria, Breitling, Asian Paints (renewal) are moved into
// "Needs me" for a fuller worklist; the rest are as captured
const ROWS = [
 ["ACT Commodities Group B.V.","Consulting","SMB","Implementation",52,175.9,null,null,0,"2029-05-31",0],
 ["AIA","Insurance","Enterprise","BAU",62,180,94,94,4500,"2029-07-31",15],
 ["ASM","Manufacturing","Enterprise","Implementation",79,240,120,100,526,"2030-09-29",15],
 ["AT&S","Manufacturing","Enterprise","Implementation",65,189,100,100,0,"2031-01-31",0],
 ["ATO","Government","Enterprise","BAU",38,550,100,100,28,"2028-04-30",22],
 ["AbbVie","Health & Life Science","Enterprise","BAU",36,251.3,45,45,162324,"2027-06-30",18],
 ["Abellio","Transportation","Enterprise","BAU",43,121.3,100,100,156,"2026-09-30",1],
 ["Achmea","Financial services","Enterprise","Implementation",77,405.2,100,100,0,"2028-11-29",0],
 ["Al Ghurair Investments","Food & beverage","Enterprise","Implementation",56,95,null,null,30,"2031-06-09",37],
 ["Allego","Automotive","SMB","BAU",62,89,100,100,1040,"2029-09-30",8],
 ["Almarai","Food & beverage","Enterprise","Implementation",72,90,100,100,618,"2028-06-29",14],
 ["Altria","Consumer goods","Enterprise","BAU",62,196.5,106,100,37584,"2027-01-15",46],
 ["American Equity","Financial services","Enterprise","BAU",44,126,100,100,4114,"2027-01-31",1],
 ["Amgen","Health & Life Science","Enterprise","BAU",48,1400,100,100,73640,"2028-03-30",3],
 ["Amprion","Energy & utilities","Enterprise","Implementation",74,689.1,100,100,6030,"2028-02-29",0],
 ["Amrest","Food & beverage","Enterprise","BAU",62,218.7,109,100,6520,"2029-08-31",16],
 ["Apollo","Financial services","Enterprise","BAU",35,231.3,103,100,0,"2027-08-18",null],
 ["Asian Paints","Manufacturing","Enterprise","BAU",66,150.5,100,100,27142,"2026-12-15",46],
 ["Axia Women's Health","Health & Life Science","SMB","Churned this FY",1,0,0,0,1878,"2027-03-22",null],
 ["Bayer AG","Health & Life Science","Enterprise","Implementation",81,1500,107,100,94,"2027-12-15",0],
 ["Boston Scientific","Manufacturing","Enterprise","BAU + Implementation",33,597.5,100,100,19970,"2027-02-28",2],
 ["Breitling","Manufacturing","Enterprise","BAU",46,42.1,100,100,1860,"2026-11-05",19],
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
  grr:[["Under 90%",14,"var(--bad-fill)"],["90 to 99%",2,"var(--warn-fill)"],["100% or more",221,"var(--good-fill)"]]
};

/* data-ta.js: GENERATED by tools/gen-ta.py from data-capture/. Do not edit by hand.
   REAL: read-only from the live AHI tenant (eme21-platform.eusb.sirioncloud.io) on 19 Nov 2026.
   Customer data: keep this repository private. */
const TA_REAL = {
  monthlyFields: ["month", "finalHealth", "commercial", "adoption", "support", "engagement", "sentiment", "renewalRisk"],
  monthly: [["2025-05", 82, 100, 98, 74, 99, 61, 0], ["2025-06", 82, 100, 98, 69, 99, 62, 0], ["2025-07", 82, 100, 97, 73, 98, 62, 0], ["2025-08", 78, 100, 94, 73, 78, 63, 0], ["2025-09", 77, 100, 96, 37, 99, 65, 0], ["2025-10", 83, 100, 98, 72, 99, 65, 0], ["2025-11", 75, 100, 81, 56, 89, 68, 0], ["2025-12", 78, 100, 83, 63, 99, 71, 0], ["2026-01", 71, 100, 79, 46, 74, 70, 0], ["2026-02", 64, 100, 65, 10, 99, 68, 0], ["2026-03", 79, 100, 87, 73, 94, 66, 0], ["2026-04", 80, 100, 80, 72, 99, 75, 0], ["2026-05", 72, 100, 60, 64, 99, 74, 0], ["2026-06", 77, 100, 78, 63, 99, 74, 0], ["2026-07", 64, 81, 77, 51, 84, 45, 0], ["2026-08", 66, 73, 85, 53, 97, 35, 0], ["2026-09", 73, 70, 86, 71, 83, 68, 0], ["2026-10", 50, 69, 75, 72, 56, 50, 0]],
  sentiment: [["2026-10", "On October 7 Nick Cavazos thanked the team after SR-179243 for the ARB Approval action was resolved. On October 27 Callie Borders confirmed Transamerica will continue with the new Early Engagement workflow step and test it in one to two weeks.", "Champion Bailey Laske handed over her role on October 21, after chasing Sirion on October 15 for the RCA on INC-177010. On October 6 Nick Cavazos asked the team to keep INC-172670 moving."], ["2026-09", "On September 2 Nick Cavazos introduced Amanda Urbancic to support system administration and asked for CLM Admin certification training. On September 9 Nick Cavazos accepted the Monthly Business Review invite.", "On September 1 Bailey Laske called INC-172670 urgent and asked for a timeline. On September 24 Alper Alper asked whether the host-key change was planned and requested advance notice of future changes."], ["2026-08", "The Executive MBR minutes set action item updates for the September 3 weekly catch-up. On August 17 Gunalan Gnanasekaran continued the CLM to Ariba Doc ID integration sessions.", "Transamerica leadership threatened renewal on August 28 and asked whether Sirion has proactive monitoring and alerts. On August 27 Bailey Laske asked for a fix ASAP because no notifications were sent for procurement lead assignment on CDR05033 and CDR05034."], ["2026-07", "On July 20 Nick Cavazos asked for weekly calls with Aditya so Transamerica's internal data matches Sirion's MBR data. A solution for Ariba Doc ID Issue #1 (Internal ID vs CWID) was ready to test by July 30.", "Repeated Action Module issues led to a confirmed escalation on July 23. On July 8 Bailey Laske said Transamerica built its own TAT/TAKT dashboards in PowerBI instead of using CLM."], ["2026-06", "On June 4 Bailey Laske said the team was at the end of its list of questions for MS Teams Collaboration. The CLM API to ProcessUnity production move was marked 'Good to Go' on June 22.", "On June 8 Bonny Bailey reported that the CLM to ProcessUnity API was not running twice a day as expected. The June 19 MBR was scheduled, but no minutes are in the file."], ["2026-05", "On May 7 Callie Borders sent Transamerica's aligned responses on the CLM Monthly Enhancements. On May 11 Nick Cavazos asked Sirion to book a follow-up on simplifying intake.", "Business users make errors on amendments, renewals and terminations because the intake configuration is not user-friendly. Integration failures between CLM and Ariba continued, with Gunalan Gnanasekaran sharing a Postman collection on May 29 after the API call."], ["2026-04", "On April 17 Nick Cavazos backed Sirion's release communication plan for V2.105.00 and asked for a clear split between mandatory and optional changes. On April 16 the Whatfix partner delivered the first Transamerica process mock-up through Ali Mansuri.", "On April 20 Callie Borders reported on #SR-142638 that CDR04487 had no workflow button. On April 28 Bailey Laske said she was still cleaning up integration failures on #SR-145506 and asked to keep delete access until the end of the week."], ["2026-03", "Bailey Laske stayed responsive and promised updates on her open tickets on March 12. On March 5 she proposed a simple fix on #SR-136538 by making the fields required and triggering the notification in the Amendment workflow.", "Transamerica found the WOPI editor not user friendly during the MBR and wants an MS Teams-like collaboration experience. The RCA for #INC134330 was still pending on March 19."], ["2026-02", "Callie Borders, Bailey Laske and Lawrence Kane accepted the MBR on February 11. Nick Cavazos received the Auto-Redlining estimate of up to 12 weeks and acknowledged the data on February 18.", "On February 17 Callie Borders reported no dashboard access and inaccurate Contract Request Analytics data. On February 11 Jaime Jones declined the MBR because she no longer works in this space and asked to add Nick instead."], ["2026-01", "The January 30 MBR showed strong adoption, a repository of about 4.5K contracts and a stable integration. On January 9 Bailey Laske answered 'Absolutely!' to Sirion's request about a Gartner review.", "On January 13 Rhonda Kepley asked for another impact report on #INC-126066 to be certain there are no more TPRM gaps. A customer comment on INC-127477 said notifications to FlexForce@Transamerica.com and fieldglass@transamerica.com were still not received."], ["2025-12", "A customer executive engaged this month, with the last contact 16 days before month end. The MBR was planned on December 4, with the MBR data prepared on December 11.", "No negative signal was raised this month. Karen Ben-Alta was out of office for the Sirion - Beeline Requirements Meeting on December 15, which is routine."], ["2025-11", "On November 28 Gunalan Gnanasekaran set up the CHG0857357 cutover checklist meeting for the production implementation. On November 5 Bailey Laske accepted waiting for the Cognitive Search (Advanced Search upgrade) timeline.", "On November 10 Gunalan Gnanasekaran reported an integration failure on Parent Agreement fields. He asked Sirion to check what value the failed API calls sent for the Hierarchical Type field."], ["2025-10", "On October 16 Krishna Garapati exchanged the ProcessUnity Sirion CLM Integration WS API startup files. On October 29 Bailey Laske was confirming the Dashboard Drill Down Columns for #SR-117230 with her team.", "Stakeholders were unable to view contracts, which led to the October 17 meeting on Confidential Contract Access. PER-4611 records that the static field Ariba CW id is missing from Cognitive Search."], ["2025-09", "On September 30 Pooja Kabotra sent the information Sirion requested for SR111995 after a call. Bailey Laske set up a recurring Transamerica/Sirion touchbase the same day.", "No customer complaint arrived this month, but no customer executive has been identified. The Executive Sponsor Briefing Call on September 19 was internal."], ["2025-08", "Bailey Laske is engaged as a stable champion who tests changes in sandbox herself. A Dashboards and Reporting session with TransAmerica was scheduled for August 12.", "On August 4 Bailey Laske said she was blocked at the Sent for Documentation status on #SR-104649 for CDR03194 and CDR03193. The August 11 MBR data thread was internal only, with no customer minutes."], ["2025-07", "A discussion on the Process Unity solution was scheduled for July 30. No complaint or confirmed escalation was raised this month.", "Customer engagement was thin, with only an out-of-office auto-reply from Gunalan Gnanasekaran on July 2. No MBR or customer meeting outcome is recorded for July."], ["2025-06", "Sirion scheduled its GenAI Capabilities Demo for TransAmerica on June 11. Bailey Laske kept Sirion informed by forwarding the SAP Ariba planned downtime notice for June 22.", "On June 17 Gunalan Gnanasekaran replied on a thread about a CLM and Ariba integration failure. The June 25 MBR was accepted only internally, by Rahul Kumar and Umang Sood."], ["2025-05", "On May 6 Bailey Laske called the help on #SR-91288 super helpful and shared it with her team. Matthew Krigbaum, Bailey Laske and Jaime Jones accepted the Monthly Business Review invite on May 15.", "No executive sponsor or champion has been identified. The May 29 MBR left no minutes in the file."]],
  contacts: [["Vaibhav Dhand", "", "vaibhav.dhand@unifyapps.com", "", "Outlook"], ["Thomas Vautour", "", "tom.vautour@processunity.com", "", "Outlook"], ["Thume", "", "thume@aegonusa.com", "", "Freshservice"], ["Tawana Perez", "", "tawana.perez@transamerica.com", "", "Freshservice"], ["Nagy, Tamas - GTS Procurement", "", "tamas.x.nagy@aegon.com", "", "Calendar"], ["Legislador, Stephanie", "", "stephanie.legislador@transamerica.com", "", "Calendar"], ["Stephanie Born", "", "stephanie.born@processunity.com", "", "Outlook"], ["Shreya Dubey", "", "shreya.dubey@unifyapps.com", "", "Outlook"], ["Ariba Administration", "", "sharibaadmin@Aegonusa.com", "", "Outlook"], ["Scott Wood", "", "scott.wood@processunity.com", "", "Outlook+Calendar"], ["Sandeep Sharma", "", "sandeep.sharma@unifyapps.com", "", "Outlook"], ["rudra.patel", "", "rudra.patel@unifyapps.com", "", "Outlook"], ["Lees, Robin", "", "robin.lees@transamerica.com", "", "Calendar"], ["Godijn, René -", "", "rene.godijn@aegon.com", "", "Outlook+Calendar"], ["Rahul Bhanushali", "", "rahul.bhanushali@unifyapps.com", "", "Outlook"], ["Kabotra, Pooja", "", "pooja.kabotra@transamerica.com", "", "Calendar"], ["You have new messages in Teams", "", "no-reply@teams.mail.microsoft", "", "Outlook"], ["Outlook", "", "no-reply@outlook.mail.microsoft", "", "Outlook"], ["Cavazos, Nick", "", "nick.cavazos@transamerica.com", "", "Outlook+Calendar"], ["Nacarato, Michael", "", "michael.nacarato@transamerica.com", "", "Calendar"], ["mduggan@castlehillrisk.com", "", "mduggan@castlehillrisk.com", "", "Outlook+Calendar"], ["Liana Smith", "", "liana.smith@beeline.com", "", "Calendar"], ["Laura Axford", "", "laxford@beeline.com", "", "Calendar"], ["Kane, Lawrence", "Head of Enterprise Procurement", "lawrence.kane@transamerica.com", "Executive Sponsor / CXO", "Calendar+Outlook"], ["Ward, Lance", "", "lance.ward@transamerica.com", "", "Outlook"], ["Kunal Garg", "", "kunal.garg@unifyapps.com", "", "Outlook"], ["Garapati, Krishna", "", "krishna.garapati@transamerica.com", "", "Calendar"], ["Meier, Katarina", "", "katarina.meier@transamerica.com", "", "Outlook"], ["Ben-Alta, Karen", "Director, External Workforce and Procurement Ops", "karen.ben-alta@transamerica.com", "Champion", "Calendar+Outlook"], ["jriehl@castlehillrisk.com", "", "jriehl@castlehillrisk.com", "", "Outlook+Calendar"], ["Zhou, Joyce", "", "joyce.zhou@transamerica.com", "", "Outlook"], ["Perez-Vernon, Jill", "", "jill.perez-vernon@transamerica.com", "", "Calendar"], ["Deitrick, Jerica", "", "jerica.deitrick@transamerica.com", "", "Calendar"], ["Lucero, Jan", "", "janice.lucero@transamerica.com", "", "Outlook+Calendar"], ["Jaismeen jaismeen", "", "jaismeen.jaismeen@whatfix.com", "", "Outlook"], ["jaime.jones@transamerica.com", "", "jaime.jones@transamerica.com", "", "Outlook"], ["Sangana, Hari", "", "hari.sangana@transamerica.com", "", "Outlook+Calendar"], ["Haley Carter", "", "haley.carter@beeline.com", "", "Calendar"], ["Nor, Gustavo", "", "gustavo.nor@sap.com", "", "Outlook+Calendar"], ["gunalan.gnanasekaran@transamerica.com", "", "gunalan.gnanasekaran@transamerica.com", "", "Outlook+Calendar"], ["Cardoso, Greice", "", "greice.cardoso@sap.com", "", "Outlook+Calendar"], ["Levey, Erica", "", "erica.levey@transamerica.com", "", "Calendar"], ["Whatfix", "", "email@whatfix.com", "", "Outlook"], ["Ali Mansuri (via Google Drive)", "", "drive-shares-dm-noreply@google.com", "", "Outlook"], ["drewe.binns@transamerica.com", "", "drewe.binns@transamerica.com", "", "Outlook+Calendar"], ["contracts@transamerica.com", "", "contracts@transamerica.com", "", "Outlook"], ["Christopher Pulichino", "", "christopher.pulichino@transamerica.com", "", "Freshservice"], ["Raju, Chandra", "", "chandra.raju@transamerica.com", "", "Outlook"], ["Catherine Sparks", "", "catherine.sparks@processunity.com", "", "Outlook+Calendar"], ["Callie", "", "callie.borders@transamerica.com", "", "Outlook+Calendar"], ["Stallworth, Brian", "", "brian.stallworth@transamerica.com", "", "Calendar"], ["Bradly Korunes", "", "bradly.korunes@beeline.com", "", "Calendar"], ["Bailey, Bonny", "", "bonny.bailey@transamerica.com", "", "Outlook+Calendar"], ["Bob Streit", "", "bob.streit@processunity.com", "", "Outlook"], ["Collier, Benita", "", "benita.collier@transamerica.com", "", "Calendar"], ["bailey.laske@transamerica.com", "", "bailey.laske@transamerica.com", "", "Freshservice+Outlook+Calendar"], ["Ayush Kedawat", "", "ayush.kedawat@unifyapps.com", "", "Outlook"], ["Anupam Malhotra", "", "anupam.malhotra@whatfix.com", "", "Outlook"], ["Alper, Alper", "", "alper.alper@aegon.com", "", "Calendar"], ["Ali Mansuri", "", "ali.mansuri@whatfix.com", "", "Outlook"], ["Dragomir, Adrian", "", "adrian.dragomir@transamerica.com", "", "Outlook+Calendar"], ["Call AI Admin", "", "admin@mindtickle.com", "", "Outlook"], ["Raj, Aditya", "", "aditya.raj@transamerica.com", "", "Outlook"], ["Adam Wefler", "", "adam.wefler@processunity.com", "", "Outlook"], ["Angie Campise", "", "acampise@beeline.com", "", "Calendar"], ["Abhishek Tyagi", "", "abhishek.tyagi@whatfix.com", "", "Outlook"], ["Wenger, Wade - TA Corporate Legislative, Regulatory and Policy", "", "Wade.Wenger1@transamerica.com", "", "Calendar"], ["Parthiban, Vivekanand", "", "Vivekanand.Parthiban@transamerica.com", "", "Outlook+Calendar"], ["Voros, Virag - GTS", "", "Virag.TothVoros@aegon.com", "", "Calendar"], ["Pressing, Viktoria", "", "Viktoria.Pressing@aegon.com", "", "Calendar"], ["Vantaru, Vamsreedhar", "", "Vamsreedhar.Vantaru@transamerica.com", "", "Outlook"], ["Iker, Tunde", "", "Tunde.Iker@aegon.com", "", "Calendar"], ["Sipe, Tim", "", "Tim.Sipe@transamerica.com", "", "Calendar"], ["Atrous, Thibaut", "", "Thibaut.Atrous@transamerica.com", "", "Calendar"], ["Sebok, Szabolcs", "", "Szabolcs.Sebok@aegon.com", "", "Calendar"], ["Desai, Sunny - Procurement", "", "Sunny.Desai@transamerica.com", "", "Outlook+Calendar"], ["Sawaitul, Shruti", "", "Shruti.Sawaitul@transamerica.com", "", "Outlook+Calendar"], ["Williams, Shalisha", "", "Shalisha.Williams@transamerica.com", "", "Calendar"], ["Fargo, Scott", "", "Scott.Fargo@transamerica.com", "", "Calendar"], ["Khatun, Salma", "", "Salma.Khatun@aegon.com", "", "Calendar"], ["Williams, Rob", "", "Rob.Williams@aegon.com", "", "Calendar"], ["Kepley, Rhonda", "", "Rhonda.Kepley@transamerica.com", "", "Outlook"], ["Adabala, Reshma", "", "Reshma.Adabala@transamerica.com", "", "Outlook+Calendar"], ["Doczi, Reka", "", "Reka.Doczi@aegon.com", "", "Calendar"], ["Mehta, Pratik", "", "Pratik.Mehta@transamerica.com", "", "Outlook+Calendar"], ["Kabotra, Pooja", "", "Pooja.Kabotra@transamerica.com", "", "Outlook+Calendar"], ["Odell-Scott, Paul", "", "Paul.ODellScott@transamerica.com", "", "Calendar"], ["Cavazos, Nick", "", "Nick.Cavazos@transamerica.com", "", "Outlook+Calendar"], ["Holschuh, Nathan", "", "Nathan.Holschuh@transamerica.com", "", "Calendar"], ["Possehl, Molly", "", "Molly.Possehl@transamerica.com", "", "Calendar"], ["Setterberg, Michell", "", "Michell.Setterberg@transamerica.com", "", "Calendar"], ["Arduser, Michele", "", "Michele.Arduser@transamerica.com", "", "Outlook"], ["McClintock, Melissa", "", "Melissa.McClintock@aegon.com", "", "Outlook+Calendar"], ["Matthew.Krigbaum@transamerica.com", "", "Matthew.Krigbaum@transamerica.com", "", "Outlook+Calendar"], ["Matthes, Mark", "", "Mark.Matthes@transamerica.com", "", "Calendar"], ["Bianchi, Mark", "", "Mark.Bianchi@transamerica.com", "", "Calendar"], ["D'Altorio, Marissa", "", "Marissa.DAltorio@transamerica.com", "", "Calendar"], ["Volterano, Marie", "", "Marie.Volterano@transamerica.com", "", "Calendar"], ["Derbich, Magda", "", "Magda.Derbich@aegon.com", "", "Outlook+Calendar"], ["Miller, Liz", "", "Liz.Miller@transamerica.com", "", "Calendar"], ["Bazelais, Leslie", "", "Leslie.Bazelais@transamerica.com", "", "Calendar"], ["Kane, Lawrence", "", "Lawrence.Kane@transamerica.com", "", "Outlook+Calendar"], ["Ward, Lance", "", "Lance.Ward@transamerica.com", "", "Calendar"], ["Delgado, Kristine - TA FIN", "", "Kristine.delgado@transamerica.com", "", "Calendar"], ["Garapati, Krishna", "", "Krishna.Garapati@transamerica.com", "", "Outlook+Calendar"], ["Jung, Kerry", "", "Kerry.Jung@transamerica.com", "", "Calendar"], ["Pohlmann, Kent", "", "Kent.Pohlmann@transamerica.com", "", "Calendar"], ["Eldred, Kelly", "", "Kelly.Eldred@transamerica.com", "", "Calendar"], ["Ungs, Kate", "", "Kate.Ungs@transamerica.com", "", "Calendar"], ["Riehl, Justin", "", "Justin.Riehl@transamerica.com", "", "Calendar"], ["Chacko, Justin", "", "Justin.Chacko@transamerica.com", "", "Calendar"], ["Beki, Judit", "", "Judit.Beki@aegon.com", "", "Calendar"], ["Zhou, Joyce", "", "Joyce.Zhou@transamerica.com", "", "Outlook+Calendar"], ["RIVERA, JOSE", "", "Jose.Rivera@transamerica.com", "", "Outlook+Calendar"], ["Frame, Jordan", "", "Jordan.Frame@transamerica.com", "", "Calendar"], ["Kaiser, Jamie", "", "Jamie.Kaiser@transamerica.com", "", "Calendar"], ["Frizzell, James", "", "James.Frizzell@transamerica.com", "", "Calendar"], ["Jones, Jaime", "", "Jaime.Jones@transamerica.com", "", "Freshservice+Outlook+Calendar"], ["Perumandla, Gopikrishna", "", "Gopikrishna.Perumandla@transamerica.com", "", "Outlook+Calendar"], ["DeVore, Garrett", "", "Garrett.DeVore@transamerica.com", "", "Calendar"], ["Akwa, Faith", "", "Faith.Akwa@transamerica.com", "", "Calendar"], ["Carter, Erika", "", "Erika.Carter@transamerica.com", "", "Outlook+Calendar"], ["Persinger, Edward", "", "Edward.Persinger@transamerica.com", "", "Calendar"], ["Binns, Drewe", "", "Drewe.Binns@transamerica.com", "", "Outlook+Calendar"], ["Curth, Doug", "", "Doug.Curth@transamerica.com", "", "Outlook+Calendar"], ["Pattni, Dipesh", "", "Dipesh.Pattni@transamerica.com", "", "Calendar"], ["Kushwaha, Deepak", "", "Deepak.Kushwaha@transamerica.com", "", "Outlook+Calendar"], ["Kotlarz, DeAnn", "", "DeAnn.Kotlarz@transamerica.com", "", "Calendar"], ["Klees, Darci", "", "Darci.Klees@Transamerica.com", "", "Calendar"], ["Raju, Chandra", "", "Chandra.Raju@transamerica.com", "", "Outlook+Calendar"], ["Schatz, Cary", "", "Cary.Schatz@Transamerica.com", "", "Outlook+Calendar"], ["Callie", "", "Callie.Borders@transamerica.com", "", "Outlook+Calendar"], ["CLM Administrator", "", "CLMadmin@transamerica.com", "", "Outlook+Calendar"], ["Priya, Bhawna", "", "Bhawna.Priya@transamerica.com", "", "Outlook"], ["Szikora, Bence", "", "Bence.Szikora@aegon.com", "", "Outlook+Calendar"], ["Aklan, Barnabas", "", "Barnabas.Aklan@aegon.com", "", "Calendar"], ["Laske, Bailey", "", "Bailey.Laske@transamerica.com", "", "Outlook+Calendar"], ["Bansal, Atul", "", "Atul.Bansal@transamerica.com", "", "Outlook+Calendar"], ["Ramesh, Arun", "", "Arun.Ramesh@transamerica.com", "", "Outlook"], ["Ispentchian, Ara", "", "Ara.Ispentchian@transamerica.com", "", "Calendar"], ["Sundstrom, Amy C.", "", "Amy.Sundstrom@Transamerica.com", "", "Outlook"], ["Urbancic, Amanda", "", "Amanda.Urbancic@transamerica.com", "", "Outlook"], ["Alper, Alper", "", "Alper.Alper@aegon.com", "", "Outlook+Calendar"], ["Fodor, Alex", "", "Alex.Fodor@aegon.com", "", "Calendar"], ["Kertai, Agnes", "", "Agnes.Kertai@aegon.com", "", "Calendar"], ["Dragomir, Adrian", "Director, Strategic Procurement & Category Management", "Adrian.Dragomir@transamerica.com", "Sirion Champion", "Calendar+Outlook"], ["Pierce, Adria", "", "Adria.Pierce@transamerica.com", "", "Calendar"], ["Aditya.Raj@transamerica.com", "", "Aditya.Raj@transamerica.com", "", "Outlook+Calendar"], ["Gaikwad, Abhinav Krishnarao", "", "AbhinavKrishnarao.Gaikwad@transamerica.com", "", "Outlook"]],
};
/* ta.js: TransAmerica's story. REAL values come from TA_REAL (generated) and the live record below;
   rules derive flags, evidence and key people from them; TA_EXAMPLE holds the only invented data. */

/* ---- real: latest scored record (ahi_kpi_daily_store_past_data, snapshot Oct 31 2026, scored Nov 18 2026) ---- */
const TA_RECORD = {
  snapshot: "2026-10-31", scoredOn: "2026-11-18",
  finalHealth: 50, weightedHealth: 62, band: "AMBER",
  overrideReason: "Renewal in 59 days, auto-renew off (max 50.0)", overrideCode: "O7",
  renewal: "2026-12-30", autoRenew: false, signedCommitment: false, tfc: false,
  carr: 330000, nrr: 100, grr: 100, expansion: 85000,
  // sub-scores (0-100); -1 means the source sent no value
  kpis: {
    commercial: [["Renewal proximity","renewalProximityHealth",39,"Renewal in 59 days at snapshot"],["Open invoices","openInvoicesHealth",100,"No overdue invoices"],["Expansion (upsell)","expansionArrHealth",0,"$85K open, nothing signed"]],
    adoption: [["Monthly active users","mauHealth",80,"222 users (12-mo avg 215)"],["Licence use","licenceUtilisationHealth",100,"663 of 593 seats"],["Contract volume","contractVolumeHealth",62,"155 processed (12-mo avg 171)"],["Active workflows","activeWorkflowsHealth",2,"0 approval cycles closed (12-mo avg 12)"],["Time to first value","timeToFirstValueHealth",-1,"241 days, not scored"]],
    support: [["SLA compliance","slaComplianceHealth",-1,"Freshservice sent no SLA value"],["Ticket reopen rate","reopenRateHealth",100,"0 reopened"],["Tickets created","ticketsCreatedHealth",99,"1 this month (12-mo avg 35)"],["Enhancement request age","jiraAvgAgeHealth",16,"423 days, 11 open Jira (12-mo avg 434)"],["Critical incidents","criticalIncidentCountHealth",-1,"0 counted, not scored"]],
    engagement: [["Executive sponsor engagement","execEngagementHealth",-1,"0 this month (12-mo avg 11)"],["Champion stability","championDepartureHealth",-1,"Champion touchpoints 0 (12-mo avg 0)"],["CSM touchpoints","csmTouchpointsHealth",15,"5 this month (12-mo avg 199)"],["Onboarding completion","onboardingCompletionHealth",97,"LMS 97%"]],
    sentiment: [["Communication sentiment trend","sentimentHealth",50,"From 23 emails this month"],["Support ticket sentiment","supportTicketSentimentHealth",-1,"No ticket sentiment scored"],["Escalations","execEscalationsHealth",-1,"0 exec Sev1 escalations, not scored"]],
    renewalRisk: [["Expansion signed","expansionArrHealth",0,"No expansion ARR signed"]],
  },
  coverage: { commercial: 1, adoption: 75, support: 0, engagement: 0, sentiment: 0, renewalRisk: 1 }, // raw cat_*_coverage values as stored
  emailsThisMonth: 23, openJira: 11, perAging: 423, approvalCycles: [12, 0],
};

const AREAS = [
  ["commercial","Commercial"],["adoption","Product adoption"],["support","Support and enhancement requests"],
  ["engagement","Customer engagement"],["sentiment","Sentiment"],["renewalRisk","Renewal risk"]];

/* ---- real: event timeline (source named on each) ---- */
const TA_EVENTS = [
  ["2025-05-15","pos","MBR accepted by Matthew Krigbaum, Bailey Laske and Jaime Jones","sentiment May 2025"],
  ["2025-10-17","neg","Meeting on confidential contract access: stakeholders could not view contracts","sentiment Oct 2025"],
  ["2025-11-10","neg","Integration failure on Parent Agreement fields (Gunalan Gnanasekaran)","sentiment Nov 2025"],
  ["2026-01-13","neg","Rhonda Kepley asked for another impact report on INC-126066 (TPRM gaps)","sentiment Jan 2026"],
  ["2026-01-30","pos","MBR showed strong adoption and a stable integration","sentiment Jan 2026"],
  ["2026-02-11","neg","Jaime Jones declined the MBR: no longer in this role, asked to add Nick Cavazos","sentiment Feb 2026"],
  ["2026-02-17","neg","Callie Borders: no dashboard access, inaccurate Contract Request Analytics","sentiment Feb 2026"],
  ["2026-07-08","neg","Bailey Laske: Transamerica built its own PowerBI dashboards instead of using CLM","sentiment Jul 2026"],
  ["2026-07-23","neg","Escalation confirmed after repeated Action Module issues","sentiment Jul 2026"],
  ["2026-08-28","neg","Transamerica leadership threatened the renewal","sentiment Aug 2026"],
  ["2026-09-09","pos","Nick Cavazos accepted the monthly business review","sentiment Sep 2026"],
  ["2026-10-21","neg","Champion Bailey Laske handed over her role","sentiment Oct 2026"],
  ["2026-10-31","flag","Health capped to 50: renewal in 59 days, auto-renew off","AHI record Oct 31"],
  ["2026-11-12","neu","Last meeting","engagement snapshot"],
  ["2026-11-16","neu","Last email","engagement snapshot"],
  ["2026-11-26","goal","Commitment target: 7 days from today, as the account insight recommends","AI insight (suggested)"],
  ["2026-12-30","end","Renewal: $330K CARR, 2 order forms","order forms"],
];

/* ---- rules ---- */
const RULES = {
  model: { label: "Current AHI model", text: "Flags when the composite health is under 70 (Watch) or under 40 (At risk). A renewal within 60 days with auto-renew off caps the composite at 50." },
  early: { label: "Early-warning rule (proposed)", text: "Flags when any of the six areas is under 50, or the composite falls 8 points or more in a month." },
};
const monthEnd = ym => { const [y,m]=ym.split("-").map(Number); return new Date(y, m, 0) };
function taMonths(){
  const f = TA_REAL.monthlyFields;
  return TA_REAL.monthly.map(r => { const o = {ym:r[0], date:monthEnd(r[0]), final:r[1], areas:{}}; f.slice(2).forEach((k,i)=>o.areas[k]=r[i+2]); return o });
}
function taFlags(){
  const ms = taMonths();
  return ms.map((m,i) => {
    const prev = i ? ms[i-1].final : null;
    const lowAreas = Object.entries(m.areas).filter(([k,v]) => k!=="renewalRisk" && v<50).map(([k])=>k);
    const drop = prev!=null ? prev - m.final : 0;
    return { ...m, model: m.final < 70, early: lowAreas.length>0 || drop>=8, lowAreas, drop };
  });
}
/* the current risk run: flagged months ending at the latest month, allowing one clear month inside it
   (TransAmerica cleared once, Sep 2026 at 73, between flags). Returns the start and the months that cleared. */
function taEpisode(key="model"){
  const fl = taFlags(); if(!fl[fl.length-1][key]) return null;
  let i = fl.length-1; const cleared = [];
  while(i>0){
    if(fl[i-1][key]) { i--; continue }
    if(i>1 && fl[i-2][key]) { cleared.push(fl[i-1]); i-=2; continue }
    break;
  }
  return { ...fl[i], cleared };
}
const DAY = 864e5;
const daysBetween = (a,b) => Math.round((b-a)/DAY);

/* evidence: every sentence of the real monthly sentiment summaries, with its date, people and ticket IDs */
const STRONG = /threatened|escalation|urgent|ASAP|handed over|not running|failure|unable|no dashboard access|inaccurate|errors|not user.friendly|blocked|declined|no longer|chasing|still not received|still pending/i;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function taPeopleIndex(){
  const idx = {};
  TA_REAL.contacts.forEach(c => { const n = bestName(c[0], c[2]); if(/\s/.test(n)) idx[n] = c[2].toLowerCase() });
  ["Rahul Kumar","Umang Sood"].forEach(n => idx[n] = "sirion");   // Sirion staff named in the summaries
  return idx;
}
/* a card with only an email or a first name takes its name from the email's local part (callie.borders -> Callie Borders) */
function bestName(n, email){
  const d = displayName(n), local = email.split("@")[0];
  if((!/\s/.test(d) || /@/.test(d)) && /^[a-z]+\.[a-z-]+$/i.test(local)) return local.split(".").map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(" ");
  return d;
}
function displayName(n){ n = n.replace(/\s+-\s.*$/,"").replace(/\(.*\)/,"").trim(); if(/,/.test(n)){ const [l,f]=n.split(",").map(s=>s.trim()); n = f+" "+l } return n.replace(/\b([A-Z])([A-Z]+)\b/g,(m,a,b)=>a+b.toLowerCase()) }
function taEvidence(){
  const people = taPeopleIndex(), names = Object.keys(people).sort((a,b)=>b.length-a.length);
  const out = [];
  TA_REAL.sentiment.forEach(([ym,pos,neg]) => {
    [["pos",pos],["neg",neg]].forEach(([kind,text]) => {
      text.split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean).forEach(s => {
        const dm = s.match(new RegExp("(" + MONTHS.join("|") + ")\\s+(\\d{1,2})"));
        const y = +ym.slice(0,4);
        const date = dm ? new Date(y, MONTHS.indexOf(dm[1]), +dm[2]) : null;
        const tickets = [...new Set((s.match(/#?(SR-?\d{4,}|INC-?\d{4,}|PER-\d+|CDR\d+|CHG\d+)/g)||[]).map(t=>t.replace("#","")))];
        const who = names.filter(n => s.includes(n));
        out.push({ ym, kind, text:s, date, tickets, who, strong: kind==="neg" && STRONG.test(s) });
      });
    });
  });
  return out;
}

/* key people: merge duplicate cards, sort by organisation and role, suggest roles from the evidence */
const ORG = {
  "transamerica.com":"Transamerica","aegon.com":"Aegon (parent)","aegonusa.com":"Aegon (parent)",
  "unifyapps.com":"UnifyApps (internal)","processunity.com":"ProcessUnity (partner)","beeline.com":"Beeline (partner)",
  "whatfix.com":"Whatfix (partner)","castlehillrisk.com":"Castle Hill (partner)","sap.com":"SAP Ariba (partner)","mindtickle.com":"Mindtickle (partner)",
};
const SYSTEM = /no-?reply|noreply|^contracts@|^clmadmin@|^sharibaadmin@|^email@|^admin@/i;
/* suggestions read from the evidence; in production this is the AI step, here written from the real summaries */
const SUGGEST = {
  "nick.cavazos@transamerica.com": ["Day-to-day owner, likely new champion","Named in 6 of the 9 monthly summaries since Feb 2026; Jaime Jones asked to add him in her place (Feb 11); accepted the Sep MBR and pushed INC-172670 in Oct."],
  "bailey.laske@transamerica.com": ["Former champion","Handed over her role on Oct 21, 2026 after 18 months as the most active contact."],
  "callie.borders@transamerica.com": ["Key user, process owner","Raised workflow and analytics issues; confirmed the Early Engagement step on Oct 27."],
  "gunalan.gnanasekaran@transamerica.com": ["Technical owner, integrations","Owns the CLM to Ariba integration threads (Jun 2025 to Aug 2026)."],
  "amanda.urbancic@transamerica.com": ["System administrator","Introduced on Sep 2, 2026 to support system administration."],
  "aditya.raj@transamerica.com": ["Reporting contact","Weekly calls to match internal data to MBR data (Jul 2026)."],
  "rhonda.kepley@transamerica.com": ["Key user, third-party risk","Asked for the INC-126066 impact report (Jan 2026)."],
  "jaime.jones@transamerica.com": ["Left the role","Declined the Feb 2026 MBR: no longer works in this space."],
  "alper.alper@aegon.com": ["IT and security contact","Asked about the host-key change (Sep 24, 2026)."],
  "bonny.bailey@transamerica.com": ["Key user, integrations","Reported the ProcessUnity API not running (Jun 8, 2026)."],
};
function taPeople(){
  const ev = taEvidence(), byEmail = new Map();
  TA_REAL.contacts.forEach(([name,title,email,role,src]) => {
    const k = email.toLowerCase(), dom = k.split("@")[1], p = byEmail.get(k) || {email:k, names:new Set(), title:"", role:"", sources:new Set(), cards:0};
    p.names.add(bestName(name, email)); if(title) p.title = title; if(role) p.role = role; src.split("+").forEach(s=>p.sources.add(s)); p.cards++;
    p.org = SYSTEM.test(k) || /google\.com|microsoft$/.test(dom) ? "System sender" : (ORG[dom] || "Other");
    byEmail.set(k, p);
  });
  return [...byEmail.values()].map(p => {
    const name = [...p.names].find(n=>/\s/.test(n) && !/@/.test(n)) || [...p.names][0];
    const mentions = ev.filter(e => e.who.includes(name));
    const last = mentions.map(e=>e.ym).sort().pop() || null;
    const s = SUGGEST[p.email];
    const conf = mentions.length>=6 ? "high" : mentions.length>=3 ? "medium" : mentions.length ? "low" : null;
    return { ...p, name, sources:[...p.sources], mentions:mentions.length, lastMentioned:last,
      tagged: p.role || null, suggested: s ? s[0] : null, basis: s ? s[1] : null, confidence: s ? (conf||"low") : null,
      customer: CUSTOMER.test(p.org) };
  });
}

/* ---- real, from public news (market signals tab): suggested people who are not in AHI's contacts ---- */
const TA_NEWS_PEOPLE = [
  { name:"Jay Orlandi", title:"EVP, Chief Legal & Corporate Affairs Officer", org:"Transamerica", suggested:"Sponsor",
    basis:"Named EVP and Chief Legal & Corporate Affairs Officer on Mar 1, 2026, with oversight of Procurement, Sirion's buying centre. Not in AHI's contacts and never named in a monthly summary.", source:"Public news, Mar 1, 2026" },
];

/* ---- examples: the only invented data. Every item carries example:true and the UI labels it. ---- */
const TA_EXAMPLE = {
  plays: [
    { id:"commit", flag:"Renewal unsigned, auto-renew off", since:"2026-10-31", sinceSrc:"Renewal cap applied in the Oct 31 record", title:"Secure the renewal commitment", steps:["Confirm the paper path with procurement","Send the renewal summary to Nick Cavazos","Agree a signature date before Dec 15"], owner:"Rahul Dev Sharma", due:"2026-11-26", outcome:null, example:true },
    { id:"sponsor", flag:"No executive contact this month", since:"2026-10-31", sinceSrc:"Executive sponsor engagement 0 in the Oct 31 record", title:"Re-engage Lawrence Kane", steps:["Book a 30-minute executive check-in","Bring the Aug 28 monitoring answer","Introduce the new Chief Legal Officer's team"], owner:"Rahul Sinha", due:"2026-12-03", outcome:null, example:true },
    { id:"champion", flag:"Champion handed over", since:"2026-10-21", sinceSrc:"Bailey Laske handed over, Oct 2026 summary", title:"Name a new champion", steps:["Confirm Nick Cavazos as day-to-day owner","Run a handover call with Bailey Laske","Update the role in AHI"], owner:"Rahul Dev Sharma", due:"2026-12-03", outcome:null, example:true },
    { id:"per", flag:"Enhancement requests aging 423 days", since:"2026-10-31", sinceSrc:"PER age 423 days in the Oct 31 record", title:"Clear the enhancement request backlog", steps:["Review the 11 open Jira items with product","Share dates for the top 3","Close or decline the rest"], owner:"Shinu Abraham", due:"2026-12-10", outcome:null, example:true },
  ],
  changed: [ // timestamps are examples; the changes themselves are real
    { at:"2026-11-18T06:10", what:"Health capped to 50", why:"Renewal in 59 days with auto-renew off (cap rule O7). Weighted score is 62.", go:"s-health", example:true },
    { at:"2026-11-18T06:10", what:"Renewal now under 60 days", why:"Dec 30, 2026; no signed commitment.", go:"runway", example:true },
    { at:"2026-10-21T09:00", what:"Champion handed over", why:"Bailey Laske handed over her role on Oct 21.", go:"s-people", example:true },
    { at:"2026-11-01T06:00", what:"Approval cycles fell from 12 to 0", why:"Active workflows score 2; contracts processed 155 vs 171 average.", go:"s-adoption", example:true },
  ],
};

/* ---- account switch: a mock pack (mock-accounts.js) replaces TransAmerica's data in place, so every reader stays as is ---- */
let CUSTOMER = /Transamerica|Aegon/;
const TA_ACCOUNT = {
  id:"ta", name:"TransAmerica", ind:"Financial services", seg:"Enterprise", region:"North America", stage:"BAU",
  sponsorEmail:"lawrence.kane@transamerica.com", sponsorNote:"no executive contact this month (12-month average 11)",
  facts:{ licence:{pct:111,used:663,bought:593}, mau:[222,215], onboarding:97.4, contracts:[155,171], approvals:[0,12], sla:95, reopen:2,
    orderForms:[{id:"CU0213 OF 001",value:275},{id:"CU0213 OF 002",value:55}], repository:[3461,2553], priority:[0,7,29,90], themeCount:16, ticketsThisMonth:1,
    tickets:"P1 0, P2 7, P3 29, P4 90", exec:"Executive sponsor engagement 0 this month (12-month average 11). CSM touchpoints 5 (12-month average 199)." },
  copy:null,
};
let ACCOUNT = TA_ACCOUNT;
const PACK = MOCK_ACCOUNTS[ACCOUNT_ID];
if (PACK) {
  const { record, monthly, sentiment, contacts, org, suggest, events, newsPeople, T: t, customer, ...meta } = PACK;
  ACCOUNT = { id: ACCOUNT_ID, ...meta };
  CUSTOMER = customer;
  for (const k of Object.keys(TA_RECORD)) delete TA_RECORD[k];
  Object.assign(TA_RECORD, record);
  Object.assign(TA_REAL, { monthly, sentiment, contacts });
  for (const k of Object.keys(ORG)) delete ORG[k];
  Object.assign(ORG, org);
  for (const k of Object.keys(SUGGEST)) delete SUGGEST[k];
  Object.assign(SUGGEST, suggest);
  TA_EVENTS.splice(0, TA_EVENTS.length, ...events);
  TA_NEWS_PEOPLE.splice(0, TA_NEWS_PEOPLE.length, ...newsPeople);
  Object.assign(T, t);
}
/** Rows with a detail page: name -> account id. */
const ACCOUNT_IDS = { TransAmerica:"ta", ...Object.fromEntries(Object.entries(MOCK_ACCOUNTS).map(([id, a]) => [a.name, id])) };
/* lib.js: shared helpers (formatting, health bands, mini ring). */
const band=s=>s==null?"":s>=70?"g":s>=40?"w":"b";
const col=s=>({g:"var(--good-fill)",w:"var(--warn-fill)",b:"var(--bad-fill)"})[band(s)]||"var(--faint)";
const money=k=>!k?"$0":k>=1000?"$"+(k/1000).toFixed(k>=10000?0:1).replace(/\.0$/,"")+"M":"$"+(k%1?k.toFixed(1):k)+"K";
const fmtDate=d=>d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
function rel(d){const days=Math.round((d-TODAY)/864e5); if(days<0){const m=Math.round(-days/30); return {t:m<1?`Overdue ${-days} days`:`Overdue ${m} mo`,c:"b",days}}
  if(days<=60) return {t:`${days} days`,c:"b",days}; if(days<=180) return {t:`${Math.round(days/30)} months`,c:"w",days};
  if(days<730) return {t:`${Math.round(days/30)} months`,c:"",days}; return {t:"2+ years",c:"",days}}

export { ACCOUNT, ACCOUNT_IDS, AREAS, band, bestName, col, DAY, daysBetween, displayName, fmtDate, money, monthEnd, MONTHS, ORG, P, rel, ROWS, RULES, STRONG, SUGGEST, SYSTEM, T, TA_EVENTS, TA_EXAMPLE, TA_NEWS_PEOPLE, TA_REAL, TA_RECORD, taEpisode, taEvidence, taFlags, taMonths, taPeople, taPeopleIndex, TODAY }
