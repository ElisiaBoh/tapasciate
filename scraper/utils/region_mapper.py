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
    Province.GOR: "Friuli-Venezia Giulia",  # codice non standard usato da FIASP per Gorizia
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


PROVINCE_TO_NAME = {
    Province.AG: "Agrigento",
    Province.AL: "Alessandria",
    Province.AN: "Ancona",
    Province.AO: "Aosta",
    Province.AP: "Ascoli Piceno",
    Province.AQ: "L'Aquila",
    Province.AR: "Arezzo",
    Province.AT: "Asti",
    Province.AV: "Avellino",
    Province.BA: "Bari",
    Province.BG: "Bergamo",
    Province.BI: "Biella",
    Province.BL: "Belluno",
    Province.BN: "Benevento",
    Province.BO: "Bologna",
    Province.BR: "Brindisi",
    Province.BS: "Brescia",
    Province.BT: "Barletta-Andria-Trani",
    Province.BZ: "Bolzano",
    Province.CA: "Cagliari",
    Province.CB: "Campobasso",
    Province.CE: "Caserta",
    Province.CH: "Chieti",
    Province.CL: "Caltanissetta",
    Province.CN: "Cuneo",
    Province.CO: "Como",
    Province.CR: "Cremona",
    Province.CS: "Cosenza",
    Province.CT: "Catania",
    Province.CZ: "Catanzaro",
    Province.EN: "Enna",
    Province.FC: "Forlì-Cesena",
    Province.FE: "Ferrara",
    Province.FG: "Foggia",
    Province.FI: "Firenze",
    Province.FM: "Fermo",
    Province.FR: "Frosinone",
    Province.GE: "Genova",
    Province.GO: "Gorizia",
    Province.GOR: "Gorizia",
    Province.GR: "Grosseto",
    Province.IM: "Imperia",
    Province.IS: "Isernia",
    Province.KR: "Crotone",
    Province.LC: "Lecco",
    Province.LE: "Lecce",
    Province.LI: "Livorno",
    Province.LO: "Lodi",
    Province.LT: "Latina",
    Province.LU: "Lucca",
    Province.MB: "Monza e della Brianza",
    Province.MC: "Macerata",
    Province.ME: "Messina",
    Province.MI: "Milano",
    Province.MN: "Mantova",
    Province.MO: "Modena",
    Province.MS: "Massa-Carrara",
    Province.MT: "Matera",
    Province.NA: "Napoli",
    Province.NO: "Novara",
    Province.NU: "Nuoro",
    Province.OR: "Oristano",
    Province.PA: "Palermo",
    Province.PC: "Piacenza",
    Province.PD: "Padova",
    Province.PE: "Pescara",
    Province.PG: "Perugia",
    Province.PI: "Pisa",
    Province.PN: "Pordenone",
    Province.PO: "Prato",
    Province.PR: "Parma",
    Province.PT: "Pistoia",
    Province.PU: "Pesaro e Urbino",
    Province.PV: "Pavia",
    Province.PZ: "Potenza",
    Province.RA: "Ravenna",
    Province.RC: "Reggio Calabria",
    Province.RE: "Reggio Emilia",
    Province.RG: "Ragusa",
    Province.RI: "Rieti",
    Province.RM: "Roma",
    Province.RN: "Rimini",
    Province.RO: "Rovigo",
    Province.SA: "Salerno",
    Province.SI: "Siena",
    Province.SO: "Sondrio",
    Province.SP: "La Spezia",
    Province.SR: "Siracusa",
    Province.SS: "Sassari",
    Province.SV: "Savona",
    Province.TA: "Taranto",
    Province.TE: "Teramo",
    Province.TN: "Trento",
    Province.TO: "Torino",
    Province.TP: "Trapani",
    Province.TR: "Terni",
    Province.TS: "Trieste",
    Province.TV: "Treviso",
    Province.UD: "Udine",
    Province.VA: "Varese",
    Province.VB: "Verbano-Cusio-Ossola",
    Province.VC: "Vercelli",
    Province.VE: "Venezia",
    Province.VI: "Vicenza",
    Province.VR: "Verona",
    Province.VT: "Viterbo",
    Province.VV: "Vibo Valentia",
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


def get_name_from_province(province: Province) -> str:
    """
    Ritorna il nome esteso della provincia data la sua sigla.

    Args:
        province: Codice provincia (enum Province)

    Returns:
        Nome esteso (es. "Bergamo"), o la sigla stessa se non mappata
    """
    return PROVINCE_TO_NAME.get(province, province.value)