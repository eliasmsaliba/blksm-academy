param(
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempDir = Join-Path $env:TEMP ("docxextract_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    [System.IO.Compression.ZipFile]::ExtractToDirectory($InputPath, $tempDir)
    $xmlPath = Join-Path $tempDir "word\document.xml"
    $bytes = [System.IO.File]::ReadAllBytes($xmlPath)
    $xmlText = [System.Text.Encoding]::UTF8.GetString($bytes)

    [xml]$doc = $xmlText
    $ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
    $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

    $paragraphs = $doc.SelectNodes("//w:body/w:p", $ns)
    $lines = New-Object System.Collections.Generic.List[string]

    foreach ($p in $paragraphs) {
        $runs = $p.SelectNodes(".//w:r", $ns)
        $lineText = ""
        $allBold = $true
        $anyText = $false
        $maxSize = 0
        foreach ($r in $runs) {
            $tNodes = $r.SelectNodes(".//w:t", $ns)
            $runText = ""
            foreach ($t in $tNodes) { $runText += $t.InnerText }
            if ($runText -ne "") {
                $anyText = $true
                $lineText += $runText
                $boldNode = $r.SelectSingleNode(".//w:rPr/w:b", $ns)
                $rPr = $r.SelectSingleNode(".//w:rPr", $ns)
                if ($boldNode -eq $null) { $allBold = $false }
                if ($rPr -ne $null) {
                    $szNode = $rPr.SelectSingleNode("w:sz", $ns)
                    if ($szNode -ne $null) {
                        $szVal = [int]$szNode.GetAttribute("val", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
                        if ($szVal -gt $maxSize) { $maxSize = $szVal }
                    }
                }
            }
        }

        # Detect numbering/list marker presence (bullet or numbered list)
        $numPr = $p.SelectSingleNode(".//w:numPr", $ns)
        $prefix = ""
        if ($numPr -ne $null) { $prefix = "- " }

        # Detect heading/style name for later structural hints
        $styleNode = $p.SelectSingleNode(".//w:pStyle", $ns)
        $style = ""
        if ($styleNode -ne $null) {
            $style = $styleNode.GetAttribute("val", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
        }

        $tags = @()
        if ($style -ne "") { $tags += "STYLE:$style" }
        if ($anyText -and $allBold) { $tags += "BOLD" }
        if ($maxSize -gt 0) { $tags += "SZ:$maxSize" }

        if ($tags.Count -gt 0) {
            $lines.Add("[$([string]::Join(',', $tags))] $prefix$lineText")
        } else {
            $lines.Add("$prefix$lineText")
        }
    }

    $outText = [string]::Join("`n", $lines)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($OutputPath, $outText, $utf8NoBom)
    Write-Host "Extracted $InputPath -> $OutputPath ($($lines.Count) paragraphs)"
}
finally {
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}
