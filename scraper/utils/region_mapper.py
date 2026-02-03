"""
Mappa province italiane → regioni.
"""
from scraper.models.provinces import Province

PROVINCE_TO_REGION = {
    # Lombardia
    Province.BG: "Lombardia",
    Province.BS: "Lombardia",
    Province.CO: "Lombardia",
    Province.CR: "Lombardia",
    Province.LC: "Lombardia",
    Province.LO: "Lombardia",
    Province.MN: "Lombardia",
    Province.MI: "Lombardia",
    Province.MB: "Lombardia",
    Province.PV: "Lombardia",
    Province.SO: "Lombardia",
    Province.VA: "Lombardia",
    
    # Piemonte
    Province.AL: "Piemonte",
    Province.AT: "Piemonte",
    Province.BI: "Piemonte",
    Province.CN: "Piemonte",
    Province.NO: "Piemonte",
    Province.TO: "Piemonte",
    Province.VB: "Piemonte",
    Province.VC: "Piemonte",
    
    # Veneto
    Province.BL: "Veneto",
    Province.PD: "Veneto",
    Province.RO: "Veneto",
    Province.TV: "Veneto",
    Province.VE: "Veneto",
    Province.VR: "Veneto",
    Province.VI: "Veneto",
    
    # Emilia-Romagna
    Province.BO: "Emilia-Romagna",
    Province.FC: "Emilia-Romagna",
    Province.FE: "Emilia-Romagna",
    Province.MO: "Emilia-Romagna",
    Province.PR: "Emilia-Romagna",
    Province.PC: "Emilia-Romagna",
    Province.RA: "Emilia-Romagna",
    Province.RE: "Emilia-Romagna",
    Province.RN: "Emilia-Romagna",
    
    # Toscana
    Province.AR: "Toscana",
    Province.FI: "Toscana",
    Province.GR: "Toscana",
    Province.LI: "Toscana",
    Province.LU: "Toscana",
    Province.MS: "Toscana",
    Province.PI: "Toscana",
    Province.PT: "Toscana",
    Province.PO: "Toscana",
    Province.SI: "Toscana",
    
    # Lazio
    Province.FR: "Lazio",
    Province.LT: "Lazio",
    Province.RI: "Lazio",
    Province.RM: "Lazio",
    Province.VT: "Lazio",
    
    # Liguria
    Province.GE: "Liguria",
    Province.IM: "Liguria",
    Province.SP: "Liguria",
    Province.SV: "Liguria",
    
    # Trentino-Alto Adige
    Province.BZ: "Trentino-Alto Adige",
    Province.TN: "Trentino-Alto Adige",
    
    # Friuli-Venezia Giulia
    Province.GO: "Friuli-Venezia Giulia",
    Province.PN: "Friuli-Venezia Giulia",
    Province.TS: "Friuli-Venezia Giulia",
    Province.UD: "Friuli-Venezia Giulia",
    
    # Valle d'Aosta
    Province.AO: "Valle d'Aosta",
    
    # Marche
    Province.AN: "Marche",
    Province.AP: "Marche",
    Province.FM: "Marche",
    Province.MC: "Marche",
    Province.PU: "Marche",
    
    # Umbria
    Province.PG: "Umbria",
    Province.TR: "Umbria",
    
    # Abruzzo
    Province.AQ: "Abruzzo",
    Province.CH: "Abruzzo",
    Province.PE: "Abruzzo",
    Province.TE: "Abruzzo",
    
    # Molise
    Province.CB: "Molise",
    Province.IS: "Molise",
    
    # Campania
    Province.AV: "Campania",
    Province.BN: "Campania",
    Province.CE: "Campania",
    Province.NA: "Campania",
    Province.SA: "Campania",
    
    # Puglia
    Province.BA: "Puglia",
    Province.BT: "Puglia",
    Province.BR: "Puglia",
    Province.FG: "Puglia",
    Province.LE: "Puglia",
    Province.TA: "Puglia",
    
    # Basilicata
    Province.MT: "Basilicata",
    Province.PZ: "Basilicata",
    
    # Calabria
    Province.CS: "Calabria",
    Province.CZ: "Calabria",
    Province.KR: "Calabria",
    Province.RC: "Calabria",
    Province.VV: "Calabria",
    
    # Sicilia
    Province.AG: "Sicilia",
    Province.CL: "Sicilia",
    Province.CT: "Sicilia",
    Province.EN: "Sicilia",
    Province.ME: "Sicilia",
    Province.PA: "Sicilia",
    Province.RG: "Sicilia",
    Province.SR: "Sicilia",
    Province.TP: "Sicilia",
    
    # Sardegna
    Province.CA: "Sardegna",
    Province.NU: "Sardegna",
    Province.OR: "Sardegna",
    Province.SS: "Sardegna",
}


def get_region_from_province(province: Province) -> str:
    """
    Ritorna la regione data una provincia.
    
    Args:
        province: Codice provincia (enum Province)
    
    Returns:
        Nome della regione
    """
    return PROVINCE_TO_REGION.get(province, "Sconosciuta")