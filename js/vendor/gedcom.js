// src: https://github.com/tmcw/gedcom via unpkg.com

!function (e, t) {
  "object" == typeof exports && "undefined" != typeof module ? t(exports, require("unist-util-visit-parents"), require("unist-util-remove"), require("graphlib-dot"), require("graphlib")) : "function" == typeof define && define.amd ? define(["exports", "unist-util-visit-parents", "unist-util-remove", "graphlib-dot", "graphlib"], t) : t((e || self).gedcom = {}, e.unistUtilVisitParents, e.unistUtilRemove, e.graphlibDot, e.graphlib)
}(this, function (e, t, r, n, E) {
  function a(e) {
    return e && "object" == typeof e && "default" in e ? e : {default: e}
  }

  var A = a(t), i = a(r), I = a(n);

  function o(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
    return n
  }

  function N(e, t) {
    var r;
    if ("undefined" == typeof Symbol || null == e[Symbol.iterator]) {
      if (Array.isArray(e) || (r = function (e, t) {
        if (e) {
          if ("string" == typeof e) return o(e, t);
          var r = Object.prototype.toString.call(e).slice(8, -1);
          return "Object" === r && e.constructor && (r = e.constructor.name), "Map" === r || "Set" === r ? Array.from(e) : "Arguments" === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r) ? o(e, t) : void 0
        }
      }(e)) || t && e && "number" == typeof e.length) {
        r && (e = r);
        var n = 0;
        return function () {
          return n >= e.length ? {done: !0} : {done: !1, value: e[n++]}
        }
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
    }
    return (r = e[Symbol.iterator]()).next.bind(r)
  }

  var R = new RegExp("^([0-9]*)"), T = new RegExp("(\\s+)"), l = new RegExp("^([" + T + "])"),
    u = new RegExp("^@([A-ZÀ-ÿa-z_0-9])([A-ZÀ-ÿa-z_0-9" + T + "#])*@"), S = new RegExp("^(_?[A-ZÀ-ÿa-z_0-9]+)"),
    C = new RegExp(/^(.*)/);

  function O(e) {
    function t(t, r) {
      var n = e.match(t);
      if (!n) throw new Error(r);
      return e = e.substring(n[0].length), n[1]
    }

    e = e.trimStart();
    var r = void 0, n = t(R, "Expected level");
    if (n.length > 2 || 2 === n.length && "0" === n[0]) throw new Error("Invalid level: " + n);
    var E = parseInt(n);
    t(l, "Expected delimiter after level");
    var a = e.match(u);
    a && (r = a[0], e = e.substring(a[0].length), t(l, "Expected delimiter after pointer"));
    var A = {level: E, tag: t(S, "Expected tag")};
    r && (A.xref_id = r);
    var i = e.match(l);
    if (i) {
      var I = (e = e.substring(i[0].length)).match(u), o = e.match(C);
      I ? A.pointer = I[0] : o && (A.value = o[1])
    }
    return A
  }

  var f = {
    ABBR: "ABBREVIATION",
    ADDR: "ADDRESS",
    ADR1: "ADDRESS1",
    ADR2: "ADDRESS2",
    ADOP: "ADOPTION",
    AFN: "AFN",
    AGE: "AGE",
    AGNC: "AGENCY",
    ALIA: "ALIAS",
    ANCE: "ANCESTORS",
    ANCI: "ANCES_INTEREST",
    ANUL: "ANNULMENT",
    ASSO: "ASSOCIATES",
    AUTH: "AUTHOR",
    BAPL: "BAPTISM-LDS",
    BAPM: "BAPTISM",
    BARM: "BAR_MITZVAH",
    BASM: "BAS_MITZVAH",
    BIRT: "BIRTH",
    BLES: "BLESSING",
    BURI: "BURIAL",
    CALN: "CALL_NUMBER",
    CAST: "CASTE",
    CAUS: "CAUSE",
    CENS: "CENSUS",
    CHAN: "CHANGE",
    CHAR: "CHARACTER",
    CHIL: "CHILD",
    CHR: "CHRISTENING",
    CHRA: "ADULT_CHRISTENING",
    CITY: "CITY",
    CONC: "CONCATENATION",
    CONF: "CONFIRMATION",
    CONL: "CONFIRMATION_LDS",
    CONT: "CONTINUED",
    COPR: "COPYRIGHT",
    CORP: "CORPORATE",
    CREM: "CREMATION",
    CTRY: "COUNTRY",
    DATA: "DATA",
    DATE: "DATE",
    DEAT: "DEATH",
    DESC: "DESCENDANTS",
    DESI: "DESCENDANT_INT",
    DEST: "DESTINATION",
    DIV: "DIVORCE",
    DIVF: "DIVORCE_FILED",
    DSCR: "PHY_DESCRIPTION",
    EDUC: "EDUCATION",
    EMAI: "EMAIL",
    EMIG: "EMIGRATION",
    ENDL: "ENDOWMENT",
    ENGA: "ENGAGEMENT",
    EVEN: "EVENT",
    FACT: "FACT",
    FAM: "FAMILY",
    FAMC: "FAMILY_CHILD",
    FAMF: "FAMILY_FILE",
    FAMS: "FAMILY_SPOUSE",
    FAX: "FACIMILIE",
    FCOM: "FIRST_COMMUNICATION",
    FILE: "FILE",
    FORM: "FORMAT",
    FONE: "PHONETIC",
    GEDC: "GEDCOM",
    GIVN: "GIVEN_NAME",
    GRAD: "GRADUATION",
    HEAD: "HEADER",
    HUSB: "HUSBAND",
    IDNO: "IDENT_NUMVER",
    IMMI: "IMMIGRATION",
    INDI: "INDIVIDUAL",
    LANG: "LANGUAGE",
    LATI: "LATITUDE",
    LONG: "LONGITUDE",
    MAP: "MAP",
    MARB: "MARRIAGE_BANN",
    MARC: "MARRIAGE_CONTRACT",
    MARL: "MARRIAGE_LICENSE",
    MARR: "MARRIAGE",
    MARS: "MARRIAGE_SETTLEMENT",
    MEDI: "MEDIA",
    NAME: "NAME",
    NATI: "NATIONALITY",
    NATU: "NATURALIZATION",
    NCHI: "CHILDREN_COUNT",
    NICK: "NICKNAME",
    NMR: "MARRIAGE_COUNT",
    NOTE: "NOTE",
    NPFX: "NAME_PREFIX",
    NSFX: "NAME_SUFFIX",
    OBJE: "OBJECT",
    OCCU: "OCCUPATION",
    ORDI: "ORDINANCE",
    ORDN: "ORDINATION",
    PAGE: "PAGE",
    PEDI: "PEDIGREE",
    PHON: "PHONE",
    PLAC: "PLACE",
    POST: "POSTAL_CODE",
    PROB: "PROBATE",
    PROP: "PROPERTY",
    PUBL: "PUBLICATION",
    QUAY: "QUALITY_OF_DATA",
    REFN: "REFERENCE",
    RELA: "RELATIONSHIP",
    RELI: "RELIGION",
    REPO: "REPOSITORY",
    RESI: "RESIDENCE",
    RESN: "RESTRICTION",
    RETI: "RETIREMENT",
    RFN: "REC_FILE_NUMBER",
    RIN: "REC_ID_NUMBER",
    ROLE: "ROLE",
    ROMN: "ROMANIZED",
    SEX: "SEX",
    SLGC: "SEALING_CHILD",
    SLGS: "SEALING_SPOUCE",
    SOUR: "SOURCE",
    SPFX: "SURN_PREFIX",
    SSN: "SURN_PREFIX",
    STAE: "STATE",
    STAT: "STATUS",
    SUBM: "SUBMITTER",
    SUBN: "SUBMISSION",
    SURN: "SURNAME",
    TEMP: "TEMPLE",
    TEXT: "TEXT",
    TIME: "TIME",
    TITL: "TITLE",
    TRLR: "TRAILER",
    TYPE: "TYPE",
    VERS: "VERSION",
    WIFE: "WIFE",
    WILL: "WILL",
    WWW: "WEB"
  }, d = new RegExp("(\\r|\\n|\\r\\n|\\n\\r)", "g");

  function M(e) {
    var t = e.tag, r = e.xref_id, n = e.pointer, E = {type: t, data: {formal_name: f[t]}, value: e.value, children: []};
    return r && (E.data.xref_id = r), n && (E.data.pointer = n), t.startsWith("_") && (E.data.custom_tag = !0), E
  }

  function c(e, t) {
    var r = e.tag, n = e.value;
    if ("CONC" !== r && "CONT" !== r) return !1;
    if (e.pointer) throw new Error("Cannot concatenate a pointer");
    return t.value || (t.value = ""), "CONT" === r && (t.value += "\n"), n && (t.value += n), !0
  }

  function D(e, t, r) {
    e[t] ? e["+" + t] = (e["+" + t] || []).concat(r) : e[t] = r
  }

  function L(e, t) {
    void 0 === t && (t = ["TRLR", "SUBM", "SUBN", "HEAD", "NOTE", "SOUR"]), i.default(e, t);
    for (var r, n = function () {
      var e = r.value;
      e.data || (e.data = {}), A.default(e, function (t, r) {
        var n, E = r.slice(1).concat(t).map(function (e) {
          var t;
          return (null == (t = e.data) ? void 0 : t.formal_name) || e.type
        }).join("/");
        t.value ? D(e.data, E, t.value) : null != (n = t.data) && n.pointer && D(e.data, "@" + E, t.data.pointer)
      }), e.children = []
    }, E = N(e.children); !(r = E()).done;) n();
    return e
  }

  function v(e) {
    var t = L(e).children, r = new Set(t.map(function (e) {
      var t;
      return null == (t = e.data) ? void 0 : t.xref_id
    }).filter(Boolean)), n = [], E = new Map;
    return t.forEach(function (e) {
      e.data && Object.entries(e.data).filter(function (e) {
        return e[0].startsWith("@")
      }).forEach(function (t) {
        var a, A, i = t[0], I = t[1];
        if (!r.has(I)) throw new Error("Undefined reference: " + I);
        if (null == (a = e.data) || !a.xref_id) throw new Error("Link from node with no xref id");
        var o = null == (A = e.data) ? void 0 : A.xref_id, N = I, R = {source: o, target: N, value: i};
        n.push(R);
        var T = [o, N].sort().join("/");
        E.has(T) ? E.get(T).push(R) : E.set(T, [R])
      })
    }), function (e, t) {
      for (var r, n = [["@HUSBAND", "@FAMILY_SPOUSE"], ["@WIFE", "@FAMILY_SPOUSE"], ["@FAMILY_CHILD", "@CHILD"]], E = function () {
        var e = r.value[1];
        n.forEach(function (r) {
          var n = r.map(function (t) {
            return e.find(function (e) {
              return e.value == t
            })
          }), E = n[0];
          E && n[1] && t.splice(t.indexOf(E), 1)
        })
      }, a = N(e); !(r = a()).done;) E()
    }(E, n), {nodes: t, links: n}
  }

  function p(e) {
    for (var t, r = v(e), n = r.nodes, a = r.links, A = new E.Graph, i = N(n); !(t = i()).done;) {
      var I, o = t.value, R = (o.data || {}).NAME;
      A.setNode(null == (I = o.data) ? void 0 : I.xref_id, {label: R ? R.replace(/^@/, "") : o.type})
    }
    for (var T, l = N(a); !(T = l()).done;) {
      var u = T.value;
      A.setEdge(u.source, u.target, {label: u.value})
    }
    return A
  }

  e.compact = L, e.parse = function (e) {
    for (var t, r = {type: "root", children: []}, n = [], E = 0, a = N(e.split(d).filter(function (e) {
      return e.trim()
    })); !(t = a()).done;) {
      var A = O(t.value);
      if (!c(A, n[n.length - 1])) {
        var i = M(A), I = A.level;
        if (0 == I) r.children.push(i), n = [i]; else {
          if (!(E == I - 1 || I <= E)) throw new Error("Illegal nesting: transition from " + E + " to " + I);
          for (var o = 0; o <= E - I; o++) n.pop();
          n[n.length - 1].children.push(i), n.push(i)
        }
        E = I
      }
    }
    return r
  }, e.toD3Force = v, e.toDot = function (e) {
    return I.default.write(p(e))
  }, e.toGraphlib = p, e.tokenize = O
});
//# sourceMappingURL=index.umd.js.map
let example = "0 HEAD\n" +
  "1 GEDC\n" +
  "2 VERS 5.5.5\n" +
  "2 FORM LINEAGE-LINKED\n" +
  "3 VERS 5.5.5\n" +
  "1 CHAR UTF-8\n" +
  "1 SOUR GS\n" +
  "2 NAME GEDCOM Specification\n" +
  "2 VERS 5.5.5\n" +
  "2 CORP gedcom.org\n" +
  "3 ADDR\n" +
  "4 CITY LEIDEN\n" +
  "3 WWW www.gedcom.org\n" +
  "1 DATE 2 Oct 2019\n" +
  "2 TIME 0:00:00\n" +
  "1 FILE 555Sample.ged\n" +
  "1 LANG English\n" +
  "1 SUBM @U1@\n" +
  "0 @U1@ SUBM\n" +
  "1 NAME Reldon Poulson\n" +
  "1 ADDR \n" +
  "2 ADR1 1900 43rd Street West\n" +
  "2 CITY Billings\n" +
  "2 STAE Montana\n" +
  "2 POST 68051\n" +
  "2 CTRY United States of America\n" +
  "1 PHON +1 (406) 555-1232\n" +
  "0 @I1@ INDI\n" +
  "1 NAME Robert Eugene /Williams/\n" +
  "2 SURN Williams\n" +
  "2 GIVN Robert Eugene\n" +
  "1 SEX M\n" +
  "1 BIRT\n" +
  "2 DATE 2 Oct 1822\n" +
  "2 PLAC Weston, Madison, Connecticut, United States of America\n" +
  "2 SOUR @S1@\n" +
  "3 PAGE Sec. 2, p. 45\n" +
  "1 DEAT\n" +
  "2 DATE 14 Apr 1905\n" +
  "2 PLAC Stamford, Fairfield, Connecticut, United States of America\n" +
  "1 BURI\n" +
  "2 PLAC Spring Hill Cemetery, Stamford, Fairfield, Connecticut, United States of America\n" +
  "1 FAMS @F1@\n" +
  "1 FAMS @F2@\n" +
  "1 RESI \n" +
  "2 DATE from 1900 to 1905\n" +
  "0 @I2@ INDI\n" +
  "1 NAME Mary Ann /Wilson/\n" +
  "2 SURN Wilson\n" +
  "2 GIVN Mary Ann\n" +
  "1 SEX F\n" +
  "1 BIRT\n" +
  "2 DATE BEF 1828\n" +
  "2 PLAC Connecticut, United States of America\n" +
  "1 FAMS @F1@\n" +
  "0 @I3@ INDI\n" +
  "1 NAME Joe /Williams/\n" +
  "2 SURN Williams\n" +
  "2 GIVN Joe\n" +
  "1 SEX M\n" +
  "1 BIRT\n" +
  "2 DATE 11 Jun 1861\n" +
  "2 PLAC Idaho Falls, Bonneville, Idaho, United States of America\n" +
  "1 FAMC @F1@\n" +
  "1 FAMC @F2@\n" +
  "2 PEDI adopted\n" +
  "1 ADOP \n" +
  "2 DATE 16 Mar 1864\n" +
  "0 @F1@ FAM\n" +
  "1 HUSB @I1@\n" +
  "1 WIFE @I2@\n" +
  "1 CHIL @I3@\n" +
  "1 MARR\n" +
  "2 DATE Dec 1859\n" +
  "2 PLAC Rapid City, Pennington, South Dakota, United States of America\n" +
  "0 @F2@ FAM\n" +
  "1 HUSB @I1@\n" +
  "1 CHIL @I3@\n" +
  "0 @S1@ SOUR\n" +
  "1 DATA\n" +
  "2 EVEN BIRT, DEAT, MARR\n" +
  "3 DATE FROM Jan 1820 TO DEC 1825\n" +
  "3 PLAC Madison, Connecticut, United States of America\n" +
  "2 AGNC Madison County Court\n" +
  "1 TITL Madison County Birth, Death, and Marriage Records\n" +
  "1 ABBR Madison BMD Records\n" +
  "1 REPO @R1@\n" +
  "2 CALN 13B-1234.01\n" +
  "0 @R1@ REPO\n" +
  "1 NAME Family History Library\n" +
  "1 ADDR\n" +
  "2 ADR1 35 N West Temple Street\n" +
  "2 CITY Salt Lake City\n" +
  "2 STAE Utah\n" +
  "2 POST 84150\n" +
  "2 CTRY United States of America\n" +
  "0 TRLR\n" +
  "\n";
let result = gedcom.parse(example);
