local function starts_with(str, start)
    return str:sub(1, #start) == start
end

local function get_ts_key(kk)
    if (string.match(kk, "-") or string.match(kk, " ")) then
        return string.format('"%s"', kk)
    else
        return string.format('%s', kk)
    end
end

local function append_def_content(ts_def, data)
    for k, v in pairs(data) do
        local t = type(v)

        if type(k) == "string" and starts_with(k, "__") then
            -- pass
        elseif t == 'string' or t == 'number' or t == 'nil' or t == 'boolean' then
            table.insert(ts_def, get_ts_key(k, const_prefix) .. ': ' .. t .. ';')
        elseif t == 'function' then
            table.insert(ts_def, const_prefix == "" and 'function ' or "" .. k .. '(...args: any[]): unknown;')
        elseif t == 'table' then
            table.insert(ts_def, get_ts_key(k, const_prefix) .. ': {')
            append_def_content(ts_def, v, "")
            table.insert(ts_def, '};')
        else
            table.insert(ts_def, get_ts_key(k, const_prefix) .. ': unknown;')
        end
    end
    return meta
end

local function export_typescriptdefs(namespaces)
    local ts_defs = {}

    for _, namespace in ipairs(namespaces) do
        local ts_def = {}
        local ts_def_comments = {}
        table.insert(ts_def_comments, "@version " .. _APP_VERSION)
        if (not _G[namespace].className_) then
            table.insert(ts_def_comments, "@noSelf")
        end

        table.insert(ts_def, string.format("/**\n* %s\n**/\nexport interface _%s {", table.concat(ts_def_comments, "\n* "), namespace))

        append_def_content(ts_def, _G[namespace])

        table.insert(ts_def, '}')

        ts_defs[namespace .. ".export.ts"] = table.concat(ts_def, " ")
    end

    return ts_defs
end

return export_typescriptdefs({ [[NAMESPACES]] })