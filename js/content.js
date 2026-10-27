// Every fact on the site lives here. Source of truth: Frank's master skills record (26 Oct 2026).
// Rules from that record hold: no SOC job title, offensive work only in sanctioned labs and
// competitions, and nothing from the never-claim list.

export const PERSON = {
  name: 'Frank Remmy',
  legal: 'Ugochukwu Remigius Chigbata',
  role: 'Support engineer, moving into security operations and GRC',
  place: 'Malta',
  links: {
    linkedin: 'https://www.linkedin.com/in/frankremmy/',
    github: 'https://github.com/frankremmy',
    x: 'https://x.com/ufrankremmy',
    blog: 'https://frankremmy.wordpress.com/'
  }
};

// Personas: the site guesses one from the browser (visitor.js) and the copy shifts its emphasis.
// The facts are the same for everyone.
export const PERSONAS = {
  default: { label: 'Just looking' },
  recruiter: { label: 'Recruiter' },
  manager: { label: 'Hiring manager' },
  engineer: { label: 'Engineer' },
  skim: { label: 'In a hurry' }
};

export const HERO = {
  k: 'Support engineer · security analyst in training',
  p: {
    default: 'Almost six years of fixing things for people who were already having a bad day. These days the broken thing has an attacker behind it, and I read the logs to find them.',
    recruiter: 'Almost six years of L2/L3 support, most recently at Automattic. MSc in IT Management and Cyber Security. Top 10 in Malta at the SANS CTF European Championship. Moving into security operations and GRC.',
    manager: 'I come from support, so I already know how to work a queue, write it down properly and talk to the person on the other end. Now I point that at alerts, audits and incidents.',
    engineer: 'I like the moment the logs disagree with the story. Wazuh, ELK, Sentinel, some reversing and a lot of grep. Press ` and there\'s a shell.',
    skim: 'Support engineer moving into SOC and GRC work. Almost six years in support, an MSc in IT Management and Cyber Security, CTF rankings and a published investigation. The short version is right below.'
  },
  meta: ['Almost 6 yrs in support', 'MSc Cyber Security', 'Top 10 Malta · SANS CTF EU'],
  hint: { mouse: 'Try it: spin the laptop, close the lid, hover the link', touch: 'Try it: drag to spin, tap to close' }
};

// The film. Timings are scroll progress (0..1) and must match film.js.
export const CHAPTERS = [
  { id: 'hook', rail: 'Hook', at: 0.085, in: 0.055, out: 0.13, tone: 'day',
    k: '01 · The hook', h: 'Every incident starts with <b>one thread.</b>',
    p: {
      default: 'This one was an email. Subject line: URGENT! Pull on it hard enough and the whole thing comes apart.',
      recruiter: 'This is a real investigation from my blog, done on a SANS training range. Keep scrolling and I\'ll walk you through it one log at a time.',
      engineer: 'Spoofed internal sender, real return path agi@yppilc.com, delivered from 34.30.110.62. Every other email in the logs came through the internal relay.'
    } },
  { id: 'click', rail: '17 seconds', at: 0.2, in: 0.155, out: 0.24, tone: 'day',
    k: '02 · Foothold', h: 'Seventeen seconds <b>to click.</b>',
    p: {
      default: 'The link was clicked 17 seconds after the email landed. Inside the zip was a "PDF" that was really an .exe. One second after it ran, it phoned home.',
      recruiter: 'A user clicked a bad link. Within two minutes the attacker had full control of that laptop. I rebuilt every step from the logs.',
      engineer: 'Sysmon 1: redactedforsecurity.pdf.exe from explorer.exe, no FileVersion, no Company, High integrity. Sysmon 3 a second later to 35.239.148.19:8080. Then getsystem over a named pipe and a read on lsass.exe.'
    } },
  { id: 'logs', rail: 'Five logs', at: 0.36, in: 0.29, out: 0.42, tone: 'night', counter: 16,
    k: '03 · The logs', h: '',
    p: {
      default: 'events that matter, out of five log sources. Windows, Sysmon, the web proxy, the email proxy and Linux auth. None of them tells the story alone. Lined up, they do.',
      recruiter: 'events that matter, found across five log sources in an ELK SIEM. This is most of the job: lining up evidence until the timeline makes sense.',
      engineer: 'timeline events pulled from Windows Security, Sysmon, HTTPProxy, EmailProxy and AuthLog in Kibana. One query per source, then line the timestamps up.'
    },
    play: 'Triage the queue' },
  { id: 'twist', rail: 'The twist', at: 0.5, in: 0.45, out: 0.545, tone: 'night',
    k: '04 · The twist', h: 'They were <b>already inside.</b>',
    p: {
      default: 'I went looking for where the stolen SSH key got used. The first hit was 40 minutes before the phishing email. The email was the second door. Somebody had already walked through the first.',
      recruiter: 'The obvious story was "user clicked a phishing link". The logs said the attacker was in 40 minutes earlier, through a different machine. Catching that is the difference between closing a ticket and closing an incident.',
      engineer: 'AuthLog: Accepted publickey for admuser from 34.30.110.62 at 13:55:22. useradd pilc at 13:59:46. Same handle as the domain, yppilc. Parallel operations, not opportunistic.'
    } },
  { id: 'map', rail: 'The map', at: 0.655, in: 0.585, out: 0.72, tone: 'night',
    k: '05 · The map', h: 'One laptop to <b>Domain Admin.</b>',
    p: {
      default: 'BloodHound mapped the whole domain in a burst of 1,200 queries. The EDR caught the first certificate trick. One minute later a second one worked. 57 minutes after the email landed, they were Domain Admin.',
      recruiter: 'From one email to full control of the company\'s directory in 57 minutes. Each red line is a step I traced and backed with a log entry.',
      engineer: 'Event 2889 x1,200 (unsigned LDAP binds). ESC1 on Administrator: 4888 denied by EDR. ESC1 on CabalUsers: 4886 issued for enforcer. 4104 shows a DACL edit on Domain Admins. 4624 type 10 into dc01.'
    } },
  { id: 'govern', rail: 'Govern', at: 0.79, in: 0.75, out: 0.835, tone: 'night',
    k: '06 · Govern', h: 'Then make sure it <b>can\'t happen again.</b>',
    p: {
      default: 'Finding it is half the job. The other half is controls, owners and evidence that the fix stuck. I\'ve done that side for real, on an ISO 27001 audit at a healthcare company.',
      recruiter: 'Detection plus governance: ISO 27001 audit evidence work in a live healthcare environment, ISO 27001 Lead Auditor training completed, and a NIST CSF assessment with a three-year security roadmap as my capstone.',
      engineer: 'Template permissions, LDAP signing, no keys on desktops, email relay rules. Each finding maps to a control, an owner and a date. ISO 27001 Annex A and NIST CSF 2.0.'
    } },
  { id: 'you', rail: 'You', at: 0.885, in: 0.86, out: 0.915, tone: 'night',
    k: '07 · You', h: '',
    p: {
      default: 'That\'s your machine, enrolled as an agent, the way I\'d enrol any endpoint. Built from what your browser told me a minute ago. None of it left this page.'
    } },
  { id: 'cases', rail: 'Cases', at: 1.02 }
];

// The case, event by event, from the write-up. Times are 9 Feb 2025, local to the range.
export const CASE = {
  title: 'How a simple email led to Active Directory compromise',
  url: 'https://frankremmy.wordpress.com/how-a-simple-email-led-to-active-directory-compromise/',
  hosts: { ws: 'ByteRider', dmz: 'cabalssh', dc: 'dc01', ca: 'ADCS', share: 'CabalFiles', atk: '34.30.110.62' },
  events: [
    { t: '13:55:22', src: 'AuthLog', what: 'SSH in with the stolen key', host: 'dmz', twist: true },
    { t: '13:59:46', src: 'AuthLog', what: 'Backdoor user "pilc" created', host: 'dmz', twist: true },
    { t: '14:36:09', src: 'EmailProxy', what: 'URGENT! email via 34.30.110.62', host: 'ws' },
    { t: '14:36:26', src: 'HTTPProxy', what: 'yppilc.com zip downloaded', host: 'ws' },
    { t: '14:37:50', src: 'Sysmon', what: 'redactedforsecurity.pdf.exe runs', host: 'ws' },
    { t: '14:37:51', src: 'Sysmon', what: 'C2 to 35.239.148.19:8080', host: 'ws' },
    { t: '14:38:22', src: 'Windows', what: 'getsystem via named pipe', host: 'ws' },
    { t: '14:38:28', src: 'Windows', what: 'lsass.exe memory read', host: 'ws' },
    { t: '14:45:48', src: 'Windows', what: 'SSH key read off the Desktop', host: 'ws' },
    { t: '15:10:00', src: 'Windows', what: 'BloodHound: 1,200 LDAP binds', host: 'dc' },
    { t: '15:14:12', src: 'Windows', what: 'ESC1 Administrator: denied', host: 'ca' },
    { t: '15:15:12', src: 'Windows', what: 'ESC1 CabalUsers: issued', host: 'ca' },
    { t: '15:18:43', src: 'Windows', what: 'CabalFiles share as enforcer', host: 'share' },
    { t: '15:33:12', src: 'Windows', what: 'DACL edit on Domain Admins', host: 'dc' },
    { t: '15:35:57', src: 'Windows', what: 'RDP into dc01', host: 'dc' },
    { t: '15:36:28', src: 'Sysmon', what: 'final_passphrase.txt opened', host: 'dc' }
  ]
};

// Log lines for the terminal's query command and the triage game. Trimmed from the write-up;
// the benign lines are made up so the game has something to be wrong about.
export const LOGS = [
  { event_source: 'EmailProxy', ReceivedIP2: '10.0.0.12', From: 'hr@cabal.local', Subject: 'Payroll calendar 2025', time: '14:02:11', bad: false, why: 'Internal relay, internal sender, boring subject. This is what normal looks like.' },
  { event_source: 'EmailProxy', ReceivedIP2: '34.30.110.62', From: 'samflynn@cabal.local', ReturnPath: 'agi@yppilc.com', Subject: 'URGENT!', time: '14:36:09', bad: true, why: 'Internal From, external return path, and the only mail that skipped the internal relay.' },
  { event_source: 'EmailProxy', ReceivedIP2: '10.0.0.12', From: 'it-helpdesk@cabal.local', Subject: 'Printer on floor 2 fixed', time: '14:20:40', bad: false, why: 'Internal relay and a sender that matches its path.' },
  { event_source: 'HTTPProxy', Domain: 'yppilc.com', Status: '200', Client: 'ByteRider', time: '14:36:26', bad: true, why: 'Same domain as the phishing return path, 17 seconds after delivery.' },
  { event_source: 'HTTPProxy', Domain: 'login.microsoftonline.com', Status: '200', Client: 'ByteRider', time: '14:31:02', bad: false, why: 'A normal Microsoft sign-in.' },
  { event_source: 'HTTPProxy', Domain: 'update.googleapis.com', Status: '204', Client: 'ByteRider', time: '14:12:55', bad: false, why: 'Chrome checking for updates.' },
  { event_source: 'Sysmon', EventID: '1', Image: 'redactedforsecurity.pdf.exe', ParentImage: 'explorer.exe', Company: '', time: '14:37:50', bad: true, why: 'Double extension, no version info, no company, launched by a double-click.' },
  { event_source: 'Sysmon', EventID: '1', Image: 'WINWORD.EXE', ParentImage: 'explorer.exe', Company: 'Microsoft Corporation', time: '14:05:13', bad: false, why: 'Signed Office binary opened by the user. Fine.' },
  { event_source: 'Sysmon', EventID: '3', Image: 'redactedforsecurity.pdf.exe', DestinationIp: '35.239.148.19', DestinationPort: '8080', time: '14:37:51', bad: true, why: 'A "PDF" making an outbound connection one second after launch. That\'s a C2 beacon.' },
  { event_source: 'Sysmon', EventID: '3', Image: 'OneDrive.exe', DestinationIp: '13.107.42.12', DestinationPort: '443', time: '14:15:30', bad: false, why: 'OneDrive syncing over HTTPS to Microsoft.' },
  { event_source: 'Windows', EventID: '4697', ServiceName: 'mlmmkw', ServiceFileName: 'cmd.exe /c echo mlmmkw > \\\\.\\pipe\\mlmmkw', time: '14:38:22', bad: true, why: 'A service whose only job is writing to a named pipe: Meterpreter getsystem.' },
  { event_source: 'Windows', EventID: '4624', TargetUserName: 'cabal_user02', LogonType: '2', time: '09:02:41', bad: false, why: 'Interactive logon at the start of the day.' },
  { event_source: 'Windows', EventID: '4663', ObjectName: 'lsass.exe', Accesses: 'Read from process memory', ProcessName: 'redactedforsecurity.pdf.exe', time: '14:38:28', bad: true, why: 'Something that isn\'t a security tool reading LSASS memory means credential theft.' },
  { event_source: 'Windows', EventID: '4663', ObjectName: 'Desktop\\admuser@10.20.20.22.ppk', Accesses: 'READ_CONTROL, SYNCHRONIZE, ReadData', time: '14:45:48', bad: true, why: 'An SSH private key left on a desktop, read by the attacker\'s session.' },
  { event_source: 'Windows', EventID: '2889', ClientIPaddress: '172.31.255.22', BindType: '0 - Simple Bind', UserID: 'cabal_user@cabal.local', time: '15:10:00', bad: true, why: 'Unsigned LDAP binds in a burst of 1,200. That\'s BloodHound mapping the domain.' },
  { event_source: 'Windows', EventID: '4888', RequestedTemplate: 'Administrator', RequestedUPN: 'administrator@cabal.local', Reason: 'EDR flagged the request', time: '15:14:12', bad: true, why: 'A certificate request for the Administrator UPN from a non-admin. ESC1, blocked this time.' },
  { event_source: 'Windows', EventID: '4886', CertificateTemplate: 'CabalUsers', UPN: 'enforcer@cabal.local', RequesterComputer: '10.20.20.22', time: '15:15:12', bad: true, why: 'Same trick, different template, one minute later. This one worked.' },
  { event_source: 'Windows', EventID: '4886', CertificateTemplate: 'WebServer', UPN: 'intranet.cabal.local', RequesterComputer: 'web01', time: '11:20:03', bad: false, why: 'A web server renewing its own certificate. Routine.' },
  { event_source: 'Windows', EventID: '4104', ScriptBlock: 'LDAP://CN=Domain Admins ... GenericAll ... add enforcer', time: '15:33:12', bad: true, why: 'A script granting itself full control of Domain Admins. Game over.' },
  { event_source: 'Windows', EventID: '4104', ScriptBlock: 'Get-Printer | Where-Object Shared', time: '10:44:19', bad: false, why: 'An admin listing shared printers.' },
  { event_source: 'Windows', EventID: '4624', TargetUserName: 'enforcer', LogonType: '10', IpAddress: '10.20.20.22', time: '15:35:57', bad: true, why: 'Remote Desktop into the domain controller from the DMZ host. Nothing good comes from the DMZ.' },
  { event_source: 'AuthLog', msg: 'Accepted publickey for admuser from 34.30.110.62 port 39734', host: 'cabalssh', time: '13:55:22', bad: true, why: 'An external IP using a key that should only live inside. 40 minutes before the email.' },
  { event_source: 'AuthLog', msg: 'new user: name=pilc, UID=1002, shell=/bin/bash', host: 'cabalssh', time: '13:59:46', bad: true, why: 'A persistence account named after the attacker\'s own domain.' },
  { event_source: 'AuthLog', msg: 'Accepted publickey for backup from 10.20.20.5 port 51022', host: 'cabalssh', time: '02:00:01', bad: false, why: 'The nightly backup job, from inside, at 2am like every night.' },
  { event_source: 'AuthLog', msg: 'pam_unix(cron:session): session opened for user root', host: 'cabalssh', time: '03:17:01', bad: false, why: 'Cron doing cron things.' }
];

// Cases (projects). "big" counts up when it scrolls into view.
export const CASES = [
  { t: 'Phishing to Domain Admin, rebuilt from logs', m: 'DFIR · SANS NetWars range · published', big: '57', unit: 'minutes from email to Domain Admin',
    p: 'Five log sources in ELK, one timeline. I found SSH access that started 40 minutes before the phishing email, and the attacker switching certificate templates one minute after the EDR blocked the first try. Every claim in the write-up is tagged as either confirmed in a log or inferred.',
    tools: ['ELK / Kibana', 'Sysmon', 'MITRE ATT&CK', 'BloodHound evidence'], link: 'https://frankremmy.wordpress.com/how-a-simple-email-led-to-active-directory-compromise/' },
  { t: 'A three-year security programme, built on NIST CSF', m: 'GRC · GRC Mastery capstone · fictional client', big: '98', unit: 'NIST CSF controls assessed',
    p: 'I assessed Oscorp, the course\'s fictional bioengineering firm, control by control: about one in five in place, and nothing at all in Respond. Then a three-year roadmap ordered by dependency. MFA, an owner for security and the end of a shared admin password come first, because they close the most risk for almost no money. The SIEM waits for year two, once there is an asset inventory for it to watch. Written before I saw the course solution, then compared against it line by line.',
    tools: ['NIST CSF', 'Gap assessment', 'Security roadmap', 'Governance'], link: 'https://github.com/frankremmy/grc-mastery/blob/main/deliverables/capstone-oscorp-security-program.md' },
  { t: 'Wazuh SIEM/XDR against a staged breach', m: 'SecOps · MedSecure Logistics scenario', big: '148', unit: 'critical vulns on the first scan',
    p: 'Stood up Wazuh 4.14, enrolled agents on Linux, Windows and macOS, and turned file integrity monitoring, vulnerability detection and ATT&CK mapping loose on a fictional medical-supply company that had an attacker sitting inside for three weeks.',
    tools: ['Wazuh', 'FIM', 'Vulnerability detection', 'MITRE ATT&CK'], link: 'https://frankremmy.wordpress.com/deploying-wazuh-siem-xdr-a-hands-on-walkthrough-using-a-simulated-breach/' },
  { t: 'Phishing risk, priced in euros with FAIR', m: 'Risk quantification · GRC Mastery · fictional client', big: '€333k', unit: 'a year in expected phishing loss',
    p: 'An earlier recommendation said Oscorp needed awareness training. This puts a number on it, using my own FAIR calculator built on the Open FAIR model, with a sensitivity sheet. About €333,000 a year in expected loss, roughly €106,500 a year net benefit from training, and a break-even at 18% effectiveness. Every input is marked as an estimate, because there was no telemetry to measure from.',
    tools: ['FAIR', 'Risk quantification', 'ROSI', 'Excel'], link: 'https://github.com/frankremmy/grc-mastery/blob/main/deliverables/11-oscorp-phishing-quantification.md' },
  { t: 'NovaPay secure system design', m: 'GRC · MSc assessment', big: '4', unit: 'regulations mapped',
    p: 'A payments company designed against PCI DSS v4.0, GDPR, DORA and NIS2. I picked Wazuh over Splunk on cost and coverage, and ran OpenVAS on AWS for the vulnerability side.',
    tools: ['PCI DSS v4.0', 'DORA', 'NIS2', 'OpenVAS'] },
  { t: 'Supplier review of a SaaS vendor holding research IP', m: 'Third-party risk · GRC Mastery · fictional client', big: '7', unit: 'risks escalated to senior management',
    p: 'Horizon Labs runs the client\'s most critical application and holds its research data. From the supplier\'s security questionnaire I escalated seven risks, including no role-based access, no vulnerability scanning, no penetration test and no incident response. My recommendation: a remediation plan with owners and dates, made a condition of continued use.',
    tools: ['Third-party risk', 'Supplier questionnaire', 'Risk rating'], link: 'https://github.com/frankremmy/grc-mastery/blob/main/deliverables/09-horizon-labs-assessment.md' },
  { t: 'Isolating a compromised EC2 instance, automatically', m: 'Cloud · AWS SimuLearn', big: '0', unit: 'clicks between alert and isolation',
    p: 'CloudWatch catches it, Lambda moves the instance into a quarantine security group, SNS tells a human and Systems Manager collects evidence. Isolate, don\'t terminate, so the evidence survives.',
    tools: ['CloudWatch', 'Lambda', 'SNS', 'Systems Manager'] },
  { t: 'HashBreaker', m: 'Tool · web and Python CLI', big: '10', unit: 'days of incremental shipping',
    p: 'A password strength checker and dictionary attack simulator. Entropy scoring and hashing in the browser with the Web Crypto API, plus a Python CLI. Built in public, one small commit at a time.',
    tools: ['JavaScript', 'Web Crypto', 'Python', 'GitHub Pages'], link: 'https://frankremmy.github.io/hashbreaker/' },
  { t: 'Twelve risks, priced', m: 'GRC · quantitative risk', big: '12', unit: 'risks with an annual loss figure',
    p: 'SLE x ARO = ALE on a live four-sheet workbook, so a risk register stops being a list of adjectives and starts being a list of numbers someone can budget for.',
    tools: ['Risk register', 'ALE', 'Excel'] },
  { t: 'CVE detection lab', m: 'Detection engineering · in progress', big: '4', unit: 'real CVEs, reproduced and detected',
    p: 'Real CVEs reproduced with Vulhub on isolated Docker networks bound to localhost, then caught with Wazuh rules and Sigma. Detection as code. Still building it.',
    tools: ['Vulhub', 'Wazuh rules', 'Sigma', 'Docker'] }
];

export const ALSO = [
  ['LockBit', 'Ransomware tabletop', 'Run against an incident response plan to see where it bends.'],
  ['Entra ID', 'Identity lab', 'Tenant, RBAC, MFA, audit logs and app registrations. Published on the blog.'],
  ['Sentinel', 'Microsoft Sentinel lab', 'Real data connectors after the training solution was retired.'],
  ['Suricata', 'IDS plus SIEM in a VPC', 'Four hosts, one CloudFormation template.'],
  ['GRC', 'grc-mastery repo', 'Risk registers and ISO 27001 / NIST CSF deliverables, in public.'],
  ['3LoD', 'Three lines of defence case study', 'An FCA-regulated investment manager\'s risk framework, read from its annual report.'],
  ['Awareness', 'Awareness programme review', 'A college\'s published awareness plan, reviewed against NIST SP 800-50.'],
  ['PQC', 'QuantGnome Leap write-up', 'Post-quantum SSH with Open Quantum Safe.']
];

// Skills as balls in buckets. Tier is Frank's own: P paid work, L lab-proven, A academic, F foundational.
export const BUCKETS = [
  { name: 'SecOps', color: '#ff5a47', skills: [
    ['Wazuh', 'L', 'Deployed and tuned for MedSecure and NovaPay, plus a four-host VPC with Suricata.'],
    ['Splunk', 'L', 'A five-alert phishing campaign triaged with case reports.'],
    ['ELK / Kibana', 'L', 'The whole Cabal investigation, five sources, one timeline.'],
    ['Sentinel + KQL', 'L', 'Workspace with Azure Activity and Entra ID connectors.'],
    ['Suricata', 'L', 'IDS in an AWS VPC, deployed with CloudFormation.'],
    ['Snort', 'L', 'PCAP analysis on TryHackMe.'],
    ['Sysmon', 'L', 'Process and network events were half the Cabal story.'],
    ['Zeek', 'L', 'Network telemetry in NetWars investigations.'],
    ['Phishing analysis', 'L', 'Relay IPs, senders, links and attachments. CTFs and the SOC sim.'],
    ['MITRE ATT&CK', 'L', 'Every write-up gets mapped.'],
    ['Alert triage', 'L', 'Case write-ups for every alert in the SOC sim.'],
    ['Grafana / Datadog', 'P', 'Observability in support engineering.']] },
  { name: 'DFIR', color: '#ffb020', skills: [
    ['Log reconstruction', 'L', 'Found the SSH access that came before the phishing.'],
    ['NIST 800-61 plans', 'A', 'The MedSecure incident response plan.'],
    ['Tabletops', 'A', 'Ransomware with injects, and a LockBit run against a real plan.'],
    ['Windows forensics', 'L', 'PowerShell, WMI, registry, services, process to port.'],
    ['Linux forensics', 'L', '/proc, ss, lsof, strings, live binary recovery.'],
    ['Wireshark', 'L', 'Found file bytes hidden in UDP header fields, solo.'],
    ['Malware analysis', 'L', 'FlareVM, PEStudio, FLOSS. Confirmed C2 beaconing.'],
    ['Malicious PDFs', 'L', '/OpenAction JavaScript with a hex C2 payload.'],
    ['VBA macros', 'L', 'Extracted and read in the AWS/SANS CTF.'],
    ['Deobfuscation', 'L', 'Multi-layer XOR with position-dependent keys.'],
    ['objdump', 'L', 'Reversed the EnCodEd loop: XOR i, +i, XOR 0x20.'],
    ['Memory forensics', 'F', 'Next up in the lab series.']] },
  { name: 'GRC', color: '#3ddc97', skills: [
    ['ISO 27001 evidence', 'P', 'Control documentation and remediation tracking at a healthcare company.'],
    ['ISO 27001 Lead Auditor', 'A', 'Completed on GRC Mastery.'],
    ['NIST CSF', 'A', 'The GRC Mastery capstone: 98 controls assessed, three-year roadmap.'],
    ['FAIR', 'A', 'Phishing risk priced in euros with my own calculator.'],
    ['Third-party risk', 'A', 'Supplier review of a SaaS vendor holding research IP.'],
    ['Risk registers', 'A', 'Kept as CSV in the grc-mastery repo.'],
    ['ALE modelling', 'A', 'Twelve risks on a live workbook.'],
    ['GDPR', 'A', 'NovaPay and the AI/ML platform plan.'],
    ['DORA', 'A', 'NovaPay.'],
    ['NIS2', 'A', 'NovaPay.'],
    ['PCI DSS v4.0', 'A', 'NovaPay.'],
    ['STRIDE', 'A', 'Threat model of a self-hosted Odoo ERP for the dissertation.'],
    ['EU AI Act', 'A', 'A multi-hospital AI/ML plan.'],
    ['ITIL 4', 'A', 'Digital platforms essay.']] },
  { name: 'Cloud', color: '#4aa8ff', skills: [
    ['AWS VPC + EC2', 'L', 'Built and diagrammed in AWS Academy labs.'],
    ['IAM', 'L', 'AWS Academy and SimuLearn.'],
    ['CloudFormation', 'L', 'The Suricata + Wazuh VPC and the Odoo lab.'],
    ['Lambda + SNS', 'L', 'Automatic EC2 isolation.'],
    ['AWS WAF', 'L', 'Hands-on workshop.'],
    ['Bedrock', 'L', 'AgentCore and Strands agent builds.'],
    ['Azure Policy', 'L', 'Fixed a region policy that blocked Sentinel.'],
    ['Docker', 'L', 'Odoo lab and Vulhub.'],
    ['Proxmox', 'L', 'Home lab.'],
    ['Linux admin', 'P', 'Hosting support, every day.']] },
  { name: 'Identity', color: '#a77bff', skills: [
    ['Active Directory', 'P', 'Provisioning, group policy and access reviews at Carburant.io.'],
    ['Group Policy', 'P', 'Same place, same years.'],
    ['Entra ID', 'L', 'Users, RBAC, MFA, audit logs, app registration.'],
    ['AD attack paths', 'L', 'ADCS ESC1 and DACL abuse, in sanctioned ranges.'],
    ['M365 admin', 'P', 'Power Automate and SharePoint too.'],
    ['Google Workspace', 'P', 'Administration.'],
    ['PowerShell', 'P', 'Admin work and forensics.'],
    ['Defender XDR', 'F', 'Studying for SC-200.']] },
  { name: 'Support', color: '#e8e4d8', skills: [
    ['L2/L3 escalations', 'P', 'About 18 to 20 cases a day at Automattic.'],
    ['Root cause', 'P', 'Nine internal reference posts: symptom, cause, fix, tip.'],
    ['WordPress', 'P', 'Automattic and LevelUp.'],
    ['WooCommerce', 'P', 'Stripe, WooPayments, Square and PayPal failures.'],
    ['SPF / DKIM / DMARC', 'P', 'Email deliverability at KV Technology LTD and Automattic.'],
    ['TLS + DNS', 'P', 'Daily support work.'],
    ['cPanel / WHM', 'P', 'Certified 2024 to 2025.'],
    ['Python', 'L', 'CTF pipelines and the HashBreaker CLI.'],
    ['Bash', 'L', 'NetWars and CTFs.'],
    ['SQL', 'P', 'MySQL, PostgreSQL, a bit of PL/SQL.'],
    ['Zendesk + Jira', 'P', 'Where the queue lives.']] }
];

export const WONT_CLAIM = ['QRadar', 'IBM SOAR', 'CrowdStrike Falcon', 'SentinelOne', 'Proofpoint', 'Sumo Logic', 'Intune (lab pending)', 'Kafka', 'Workday'];

// Career, oldest first.
export const PATH = [
  { y: '2018', h: 'Open-Source Contributor', o: 'Utopian.io', p: 'Copywriting and social for open-source projects. I wrote the About page for Minecolonies, and it\'s still up.', st: 'Start' },
  { y: '2020', h: 'WordPress & WooCommerce Developer', o: 'B Dulce', p: 'Ran the store, rebuilt it on staging, got bounce rate down to 48% and cleaned up malware when it showed up.', st: 'Done' },
  { y: '2021', h: 'QA Tester', o: 'Testlio · Snap Inc. contingent worker', p: 'Test runs and defect reports, including on Snapchat. Learned to write a bug report a developer actually reads.', st: 'Done' },
  { y: '2021', h: 'Technical Support Engineer', o: 'KV Technology LTD · Mailvio', p: 'Account and billing issues, plus email deliverability: SPF, DKIM, DMARC, IP reputation and abuse monitoring.', st: 'Done' },
  { y: '2022', h: 'Technical Support Engineer', o: 'LevelUp · Thrive Themes, The Events Calendar', p: 'WordPress plugin support at 94.8% CSAT. Reproduce, work around, file it in Jira, follow up.', st: 'Done' },
  { y: '2023', h: 'L2 Support & Deployment Engineer', o: 'Carburant.io', p: 'Where support turned into security: ISO 27001 audit evidence, remediation tracking, on-prem clinical systems, Windows Server and AD.', st: 'Done' },
  { y: '2024', h: 'WebOps Manager', o: 'The Inclusive AI', p: 'Built and ran theinclusiveai.org.', st: 'Done' },
  { y: '2025', h: 'Support Engineer', o: 'Automattic · WordPress.com, WooCommerce', p: 'L2/L3 escalations across hosting, DNS, TLS, email and payments. Compromised sites. Took my quality rating from 81% to 94.35% in three months.', st: 'Done' },
  { y: '2026', h: 'MSc IT Management and Cyber Security', o: 'GBS Malta · SANS Cybersecurity Immersion', p: 'Incident response, GRC, threat modelling and a lot of lab hours. Top 10 in Malta at the SANS CTF European Championship.', st: 'Now' }
];

export const WITNESSES = [
  { q: 'He is a true team player, consistently aware of his weaknesses and leveraging his strengths.', n: 'Abz A.', r: 'Team Lead, LevelUp' },
  { q: 'What I liked most about him is his resilience, he will find a solution for something no matter how hard it is.', n: 'Dame Bizimoski', r: 'Deliverability Expert, Senders' },
  { q: 'Despite challenging deadlines and high-pressure situations, he remained calm and focused, consistently delivering accurate and reliable output.', n: 'Dawn Marie Duallo', r: 'VA / HR, KV Technology LTD' },
  { q: 'He loves process and results; he follows steps judiciously to address every aspect of the problem.', n: 'Rachael Asikpo', r: 'Ghost/Memoir Writer' },
  { q: 'I\'ve always relied on him if I need a fresh set of eyes when I\'m stuck and he gives good advice towards the challenges I encounter.', n: 'Marvin Antalan', r: 'Lead Support, Mailvio' },
  { q: 'Frank is determined to face challenges and eager to volunteer for tasks.', n: 'June Christian Nacpil', r: 'Support Operations Manager, LevelUp' },
  { q: 'Frank was always focused and dedicated, quickly picking up complex concepts and applying them with ease.', n: 'Adrian Navaja', r: 'Senior Support Engineer, LevelUp' },
  { q: 'An exceptional individual whose contributions have consistently exceeded our expectations.', n: 'Kaeser Valencerina', r: 'Senior Product Support Analyst' },
  { q: 'I love that he initiates his own education about any project he is tasked with.', n: 'Crystal Ndudiri', r: 'Business Consultant' }
];

export const CREDS = [
  { seal: 'AWS<br>CCP', h: 'AWS Certified Cloud Practitioner', m: 'Amazon Web Services · Held', back: 'Cloud concepts, security and compliance, core AWS services, billing.' },
  { seal: 'G<br>SEC', h: 'Google Cybersecurity', m: 'Google · Jan 2025', back: 'SIEM, Linux, SQL, Python, network security and incident response basics.' },
  { seal: 'G<br>IT', h: 'Google IT Support', m: 'Google · Mar 2022', back: 'Networking, operating systems, system administration and security.' },
  { seal: 'THM<br>101', h: 'Cyber Security 101', m: 'TryHackMe · Apr 2026', back: 'The full path. 45 hours of recorded lab time over about six months.' },
  { seal: 'ISO<br>LA', h: 'ISO 27001 Lead Auditor', m: 'GRC Mastery · 2026', back: 'Planning an audit, gathering evidence and writing findings the Lead Auditor way. Notes are public on GitHub.' },
  { seal: 'IoT', h: 'Next-Level IoT: Connectivity & Smart Systems', m: 'DihubMT · Jul 2026', back: 'Microcontroller programming, MQTT messaging, cloud platforms, actuators and control, plus a mini-project.' },
  { seal: 'SC<br>200', h: 'Security Operations Analyst', m: 'Microsoft · In progress', back: 'Sentinel, Defender XDR and KQL. Study plan and Sentinel lab built.', pend: true },
  { seal: 'cP', h: 'cPanel Professional + WHM', m: 'cPanel · Held 2024 to 2025', back: 'cPanel and WHM administration. Expired Sep 2025.', past: true }
];

export const RANKS = [
  { n: 'Top 4', h: 'BMIT · The Cybersecurity Imperative 2026', p: 'Prompt injection against an LLM-backed challenge.' },
  { n: 'Top 10', h: 'SANS CTF European Championship 2026', p: 'In Malta. Forensics, incident response and radio signals.' }
];

// The fallback when the blog API can't be reached.
export const POSTS = [
  { title: 'Deploying Wazuh SIEM/XDR: a hands-on walkthrough using a simulated breach', date: '2026-06-10', url: 'https://frankremmy.wordpress.com/deploying-wazuh-siem-xdr-a-hands-on-walkthrough-using-a-simulated-breach/' },
  { title: 'How a simple email led to Active Directory compromise', date: '2026-05-31', url: 'https://frankremmy.wordpress.com/how-a-simple-email-led-to-active-directory-compromise/' },
  { title: 'AWS networking concepts explained: VPC, subnets, CIDR, Route 53 and CloudFront', date: '2026-04-27', url: 'https://frankremmy.wordpress.com/aws-networking-concepts-explained-vpc-subnets-cidr-route-53-and-cloudfront/' },
  { title: 'How to build a VPC and launch a web server on AWS', date: '2026-04-25', url: 'https://frankremmy.wordpress.com/how-to-build-a-vpc-and-launch-a-web-server-on-aws/' },
  { title: 'Setting up your Entra ID lab environment', date: '2026-04-02', url: 'https://frankremmy.wordpress.com/setting-up-a-microsoft-identity-lab/' }
];

// Flags for the hunt. Stored hashed so view-source doesn't hand them over.
// Each flag's location: robots.txt, the 404 page, an HTML comment (base64),
// the terminal's challenge.bin (position-keyed XOR), and security.txt.
export const FLAG_HINTS = [
  'Polite crawlers read a file before they read the site.',
  'Even a page that doesn\'t exist has something to say. Ask for one.',
  'View the source. Something near the top ends in ==.',
  'In the terminal: cat challenge.bin. Each byte was XORed with its own position, starting at 1.',
  'Security people publish how to reach them in a well-known place.'
];
