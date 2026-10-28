"""Apply the audited lot21 IDB annotations. Run only inside the intended IDA database."""
import json
import hashlib
import pathlib
import ida_nalt
import ida_loader
import ida_funcs
import ida_name
import ida_bytes
import ida_typeinf
import idc

PLAN = pathlib.Path(r"C:\Users\djden\source\repos\retro-eng\re-ff8\docs\tech\investigation\battle-static-discovery\driver-passthrough\IDB_SYNC_lot21_2026-10-02.json")
EXPECTED_PLAN_SHA = "23785c100c7d35e946b467cc61e619a3dd66722b00c4dc0a518b2f20070f686a"
ALLOWED = {0x45D080, 0x4617F0, 0x461A30, 0x465CE0, 0x465930, 0x4178D7, 0x460CE0, 0x45BC60, 0x41619A, 0x41E752}

def digest(text):
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()

def apply():
    raw = PLAN.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == EXPECTED_PLAN_SHA, "Plan changed"
    plan = json.loads(raw.decode("utf-8-sig"))
    assert ida_nalt.retrieve_input_file_md5().hex() == plan["idb"]["input_md5"], "Wrong input"
    assert pathlib.Path(ida_loader.get_path(ida_loader.PATH_TYPE_IDB)) == pathlib.Path(plan["idb"]["path"]), "Wrong IDB"
    assert len(plan["functions"]) == 10 and {int(e["ea"], 16) for e in plan["functions"]} == ALLOWED, "Unexpected scope"
    tag = plan["apply_policy"]["comment_block_id"]
    new_tif = ida_typeinf.tinfo_t()
    assert ida_typeinf.parse_decl(new_tif, None, "void __cdecl Gpu_EndPrimitivePass(void);", ida_typeinf.PT_SIL), "Type parse failed"
    get_tinfo = getattr(ida_typeinf, "get_tinfo", None) or getattr(ida_nalt, "get_tinfo", None)
    assert get_tinfo, "Missing get_tinfo API"
    old_tif = ida_typeinf.tinfo_t()
    assert get_tinfo(old_tif, 0x460CE0), "Missing previous type"
    rows = []
    for entry in plan["functions"]:
        ea = int(entry["ea"], 16)
        f = ida_funcs.get_func(ea)
        p = entry["preimage"]
        assert f and f.start_ea == ea, hex(ea)
        assert ida_name.get_name(ea) == p["name"], "Name CAS " + hex(ea)
        assert idc.get_type(ea) == p["type"], "Type CAS " + hex(ea)
        old_nr = ida_funcs.get_func_cmt(f, False)
        old_r = ida_funcs.get_func_cmt(f, True)
        assert digest(old_nr) == p["nonrepeatable_comment_sha256"], "Comment CAS " + hex(ea)
        assert digest(old_r) == p["repeatable_comment_sha256"], "Repeatable CAS " + hex(ea)
        assert tag not in (old_nr or ""), "Block already present"
        assert entry["comment_append"].startswith(tag), "Wrong block"
        assert not entry["rename_to"] or (ea == 0x460CE0 and entry["rename_to"] == "Gpu_EndPrimitivePass"), "Unexpected rename"
        assert not entry["type_to"] or (ea == 0x460CE0 and entry["type_to"] == "void __cdecl(void)"), "Unexpected type"
        if entry["rename_to"]:
            used = ida_name.get_name_ea(idc.BADADDR, entry["rename_to"])
            assert used in (idc.BADADDR, ea), "Name collision"
        rows.append({
            "entry": entry, "ea": ea, "f": f,
            "old_nr": old_nr, "old_r": old_r,
            "old_name": p["name"], "old_type": p["type"],
            "merged": (old_nr + "\n\n" if old_nr else "") + entry["comment_append"],
            "code_sha": hashlib.sha256(ida_bytes.get_bytes(f.start_ea, f.end_ea - f.start_ea)).hexdigest()
        })

    changed = []
    renamed = False
    typed = False
    try:
        for row in rows:
            assert ida_funcs.set_func_cmt(row["f"], row["merged"], False), "Comment write failed " + hex(row["ea"])
            changed.append(row)
        assert ida_name.set_name(0x460CE0, "Gpu_EndPrimitivePass", ida_name.SN_CHECK), "Rename failed"
        renamed = True
        assert ida_typeinf.apply_tinfo(0x460CE0, new_tif, ida_typeinf.TINFO_DEFINITE), "Type apply failed"
        typed = True
        current_tif = ida_typeinf.tinfo_t()
        assert get_tinfo(current_tif, 0x460CE0) and current_tif == new_tif, "Type verification failed"
        for row in rows:
            ea = row["ea"]
            f = ida_funcs.get_func(ea)
            assert ida_funcs.get_func_cmt(f, False) == row["merged"], "Comment mismatch"
            assert ida_funcs.get_func_cmt(f, True) == row["old_r"], "Repeatable changed"
            assert hashlib.sha256(ida_bytes.get_bytes(f.start_ea, f.end_ea - f.start_ea)).hexdigest() == row["code_sha"], "Code changed"
            assert ida_name.get_name(ea) == ("Gpu_EndPrimitivePass" if ea == 0x460CE0 else row["old_name"]), "Name changed"
            if ea != 0x460CE0:
                assert idc.get_type(ea) == row["old_type"], "Unrequested type changed"
    except Exception:
        if typed:
            ida_typeinf.apply_tinfo(0x460CE0, old_tif, ida_typeinf.TINFO_DEFINITE)
        if renamed:
            ida_name.set_name(0x460CE0, "sub_460CE0", ida_name.SN_CHECK)
        for row in reversed(changed):
            ida_funcs.set_func_cmt(row["f"], row["old_nr"] or "", False)
        raise

    result = {
        "status": "applied_verified_not_saved",
        "plan": str(PLAN), "plan_sha256": EXPECTED_PLAN_SHA,
        "idb": ida_loader.get_path(ida_loader.PATH_TYPE_IDB),
        "input_md5": ida_nalt.retrieve_input_file_md5().hex(),
        "comments_appended": len(rows), "renames": 1, "type_changes": 1,
        "historical_comments_preserved": True,
        "repeatable_comments_preserved": True, "code_bytes_unchanged": True,
        "functions": [{
            "ea": hex(row["ea"]), "name_before": row["old_name"],
            "name_after": ida_name.get_name(row["ea"]),
            "type_before": row["old_type"], "type_after": idc.get_type(row["ea"]),
            "comment_before_sha256": digest(row["old_nr"]),
            "comment_after_sha256": digest(row["merged"]),
            "code_sha256": row["code_sha"]
        } for row in rows]
    }
    print(json.dumps(result, ensure_ascii=False))

apply()

