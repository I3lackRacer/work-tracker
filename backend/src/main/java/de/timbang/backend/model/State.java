package de.timbang.backend.model;

import lombok.Getter;

@Getter
public enum State {
    BW("Baden-Württemberg"),
    BY("Bayern"),
    BE("Berlin"),
    BB("Brandenburg"),
    HB("Bremen"),
    HH("Hamburg"),
    HE("Hessen"),
    MV("Mecklenburg-Vorpommern"),
    NI("Niedersachsen"),
    NW("Nordrhein-Westfalen"),
    RP("Rheinland-Pfalz"),
    SL("Saarland"),
    SN("Sachsen"),
    ST("Sachsen-Anhalt"),
    SH("Schleswig-Holstein"),
    TH("Thüringen"),
    NATIONAL("Deutschlandweit");

    private final String displayName;

    State(String displayName) {
        this.displayName = displayName;
    }

}