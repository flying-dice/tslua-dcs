-- DCS Studio eval chunk. The driver substitutes the two quoted placeholders.
local namespace = [[NAMESPACE]]
local dcs_version = [[DCS_VERSION]]
local MAX_DEPTH, MAX_MEMBERS, MAX_SIZE = 12, 20000, 2000000
local members, size = 0, 0

local function die(message) error("tslua-dcs export " .. namespace .. ": " .. message) end
local function ts_quote(value)
  return '"' .. value:gsub('\\', '\\\\'):gsub('"', '\\"'):gsub('\n', '\\n'):gsub('\r', '\\r'):gsub('\t', '\\t'):gsub('[%z\1-\8\11\12\14-\31]', function(c) return string.format('\\u%04x', string.byte(c)) end) .. '"'
end
local function key_text(key)
  if type(key) == "string" then
    if key:match("^[A-Za-z_$][A-Za-z0-9_$]*$") then return key end
    return ts_quote(key)
  end
  if type(key) == "number" and key == math.floor(key) then return "[" .. key .. "]" end
  die("unsupported key type " .. type(key))
end
local function representable_key(key)
  return type(key) == "string" or (type(key) == "number" and key == math.floor(key))
end
local function sorted_keys(value)
  local keys, omitted = {}, 0
  for key in pairs(value) do
    if representable_key(key) then table.insert(keys, key) else omitted = omitted + 1 end
  end
  table.sort(keys, function(a,b) local ta,tb=type(a),type(b); if ta ~= tb then return ta < tb end; return tostring(a) < tostring(b) end)
  return keys, omitted
end
local function emit(lines, text)
  size = size + #text; if size > MAX_SIZE then die("generated source exceeds size limit") end
  table.insert(lines, text)
end
local function append(lines, value, depth, ancestors, path)
  if depth > MAX_DEPTH then die("depth limit at " .. path) end
  local indent = string.rep("\t", depth + 1)
  local keys, omitted = sorted_keys(value)
  if omitted > 0 then
    emit(lines, indent .. "/**")
    emit(lines, indent .. " * Omitted " .. omitted .. " non-representable Lua key(s) at " .. ts_quote(path) .. ";")
    emit(lines, indent .. " * their values are unknown because TypeScript cannot name Lua table keys.")
    emit(lines, indent .. " */")
  end
  for _, key in ipairs(keys) do
    if not (type(key) == "string" and key:sub(1,2) == "__") then
      members = members + 1; if members > MAX_MEMBERS then die("member limit at " .. path) end
      local item = rawget(value, key); local kind = type(item); local name = key_text(key)
      if kind == "function" then emit(lines, indent .. name .. "(...args: any[]): unknown;")
      elseif kind == "string" then emit(lines, indent .. name .. ": string;")
      elseif kind == "number" then emit(lines, indent .. name .. ": number;")
      elseif kind == "boolean" then emit(lines, indent .. name .. ": boolean;")
      elseif kind == "table" then
        if ancestors[item] then
          emit(lines, indent .. "/**")
          emit(lines, indent .. " * Cyclic reference at " .. ts_quote(path .. "." .. tostring(key)) .. ".")
          emit(lines, indent .. " */")
          emit(lines, indent .. name .. ": unknown;")
        else ancestors[item] = true; emit(lines, indent .. name .. ": {"); append(lines, item, depth + 1, ancestors, path .. "." .. tostring(key)); emit(lines, indent .. "};"); ancestors[item] = nil end
      else emit(lines, indent .. name .. ": unknown;") end
    end
  end
end

local root = rawget(_G, namespace)
if type(root) ~= "table" then die("root is not a table") end
if type(dcs_version) ~= "string" or dcs_version == "" then die("DCS version is missing") end
local comment_version = dcs_version:gsub("%*/", "* /"):gsub("[\r\n]", " ")
local lines = { "/**", " * @version " .. comment_version }
if not rawget(root, "className_") then table.insert(lines, " * @noSelf") end
table.insert(lines, " */"); table.insert(lines, "export interface _" .. namespace .. " {")
append(lines, root, 0, { [root] = true }, namespace); table.insert(lines, "}")
return { [namespace .. ".export.ts"] = table.concat(lines, "\n") .. "\n" }
