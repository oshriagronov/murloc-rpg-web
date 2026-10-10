// Translates the game's C# scripts to TypeScript for the engine in src/engine.
//
//   dotnet run --project tools/cs2ts -- <scripts-dir> <managed-dll-dir> <out-dir> [--only Name,...] [--skip Name,...]
//
// It uses the C# compiler's own analysis, so the things that silently change
// meaning between the two languages are handled from type information:
// integer division, float-to-int casts, value-type (struct) copies, implicit
// `this`, operators on vectors, Unity's "destroyed object equals null" rule
// and number-to-text formatting.
//
// The output was a starting point: the files in src/game are now maintained by
// hand, and this tool is kept to document how they were produced.

using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

static class Program
{
	static readonly Regex NotGame = new(@"^(TMP_|TMPro_|Benchmark|CameraController|ObjectSpin|ShaderPropAnimator|SimpleScript|SkewTextExample|TeleType|TextConsoleSimulator|TextMeshProFloatingText|TextMeshSpawner|VertexColorCycler|VertexJitter|VertexShake|VertexZoom|WarpTextExample|ChatController|EnvMapAnimator)");

	static int Main(string[] args)
	{
		var pos = args.Where(a => !a.StartsWith("--")).ToArray();
		if (pos.Length < 3) { Console.Error.WriteLine("usage: cs2ts <scripts-dir> <managed-dll-dir> <out-dir> [--only A,B] [--skip A,B]"); return 2; }
		string scripts = pos[0], managed = pos[1], outDir = pos[2];
		HashSet<string> Opt(string name) { var i = Array.IndexOf(args, name); return i >= 0 && i + 1 < args.Length ? args[i + 1].Split(',').ToHashSet() : null; }
		var only = Opt("--only"); var skip = Opt("--skip") ?? new HashSet<string>();

		var files = Directory.GetFiles(scripts, "*.cs").Where(f => !NotGame.IsMatch(Path.GetFileName(f))).OrderBy(f => f).ToArray();
		var trees = files.Select(f => CSharpSyntaxTree.ParseText(File.ReadAllText(f), path: f)).ToArray();
		var refs = Directory.GetFiles(managed, "*.dll").Where(f => Path.GetFileName(f) != "Assembly-CSharp.dll").Select(f => (MetadataReference)MetadataReference.CreateFromFile(f));
		var compilation = CSharpCompilation.Create("Game", trees, refs, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, allowUnsafe: true));
		var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
		if (errors.Length > 0)
		{
			foreach (var e in errors.Take(10)) Console.Error.WriteLine(e);
			Console.Error.WriteLine($"{errors.Length} C# errors: the scripts must compile before they can be translated.");
			return 1;
		}

		var world = new World(compilation);
		Directory.CreateDirectory(outDir);
		int written = 0;
		foreach (var tree in trees)
		{
			var name = Path.GetFileNameWithoutExtension(tree.FilePath);
			if (skip.Contains(name) || (only != null && !only.Contains(name))) continue;
			var emitter = new Emitter(world, compilation.GetSemanticModel(tree), name);
			File.WriteAllText(Path.Combine(outDir, name + ".ts"), emitter.File((CompilationUnitSyntax)tree.GetRoot()));
			written++;
		}
		Console.WriteLine($"{written} files written to {outDir}");
		foreach (var kv in world.Todo.OrderByDescending(k => k.Value)) Console.WriteLine($"  not translated: {kv.Key} x{kv.Value}");
		return 0;
	}
}

/// <summary>Facts about the whole program that every file's translation needs.</summary>
class World
{
	public readonly CSharpCompilation Compilation;
	public readonly Dictionary<string, int> Todo = new();
	/// <summary>Classes that must be looked up by name at run time instead of imported, to keep module loading acyclic.</summary>
	public readonly HashSet<INamedTypeSymbol> Lazy = new(SymbolEqualityComparer.Default);
	/// <summary>Member names declared at more than one level of an inheritance chain: TypeScript cannot make those private.</summary>
	public readonly HashSet<(INamedTypeSymbol, string)> Shared = new();
	/// <summary>New names for all but the first of a set of overloaded methods.</summary>
	public readonly Dictionary<IMethodSymbol, string> Renamed = new(SymbolEqualityComparer.Default);
	public readonly List<INamedTypeSymbol> Types = new();

	public World(CSharpCompilation compilation)
	{
		Compilation = compilation;
		void Collect(INamespaceOrTypeSymbol s)
		{
			foreach (var t in s.GetTypeMembers()) { if (t.Locations.Any(l => l.IsInSource)) { Types.Add(t); Collect(t); } }
			if (s is INamespaceSymbol ns) foreach (var n in ns.GetNamespaceMembers()) Collect(n);
		}
		Collect(compilation.Assembly.GlobalNamespace);

		foreach (var t in Types)
		{
			// A subclass of a game class whose base refers (directly) to other game classes is loaded lazily.
			var b = t.BaseType;
			if (b != null && IsGame(b) && b.DeclaringSyntaxReferences.Any(r => r.GetSyntax().DescendantNodes().OfType<IdentifierNameSyntax>()
				.Any(id => compilation.GetSemanticModel(id.SyntaxTree).GetSymbolInfo(id).Symbol is INamedTypeSymbol n && IsGame(n) && !SymbolEqualityComparer.Default.Equals(n, b))))
				Lazy.Add(t);

			for (var a = t.BaseType; a != null && IsGame(a); a = a.BaseType)
				foreach (var m in t.GetMembers().Where(m => !m.IsImplicitlyDeclared && m.Kind is SymbolKind.Field or SymbolKind.Method or SymbolKind.Property))
					if (a.GetMembers(m.Name).Any()) { Shared.Add((t, m.Name)); Shared.Add((a, m.Name)); }

			foreach (var g in t.GetMembers().OfType<IMethodSymbol>().Where(m => m.MethodKind == MethodKind.Ordinary).GroupBy(m => m.Name).Where(g => g.Count() > 1))
				foreach (var m in g.Skip(1))
					Renamed[m] = m.Name + "_" + string.Join("_", m.Parameters.Select(p => p.Type.Name.ToLowerInvariant()));
		}
	}

	public static bool IsGame(ITypeSymbol t) => t != null && t.Locations.Any(l => l.IsInSource);
	public void Note(string what) => Todo[what] = Todo.GetValueOrDefault(what) + 1;
}

class Emitter
{
	readonly World world;
	readonly SemanticModel model;
	readonly string fileName;
	readonly SortedSet<string> engine = new(StringComparer.Ordinal);
	readonly SortedSet<string> game = new(StringComparer.Ordinal);
	readonly SortedSet<string> gameTypesOnly = new(StringComparer.Ordinal);
	readonly StringBuilder sb = new();
	int depth;

	static readonly HashSet<string> Reserved = new() { "arguments", "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "finally", "function", "import", "in", "instanceof", "new", "package", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield", "let", "static", "interface", "private", "protected", "public", "implements" };
	static readonly HashSet<string> UnityMessages = new() { "Awake", "Start", "Update", "LateUpdate", "FixedUpdate", "OnEnable", "OnDisable", "OnDestroy", "OnTriggerEnter2D", "OnTriggerExit2D", "OnTriggerStay2D", "OnCollisionEnter2D", "OnCollisionExit2D", "OnTriggerEnter", "OnTriggerExit", "OnMouseDown", "OnMouseUp", "OnMouseOver", "OnMouseEnter", "OnMouseExit", "OnMouseDrag", "OnApplicationQuit", "OnStateEnter", "OnStateExit", "OnStateUpdate" };
	static readonly HashSet<string> CopiedStructs = new() { "Vector2", "Vector3", "Vector4", "Quaternion", "Color", "Rect" };

	public Emitter(World world, SemanticModel model, string fileName) { this.world = world; this.model = model; this.fileName = fileName; }

	// ------------------------------------------------------------ output helpers

	void Line(string s = "") { if (s.Length > 0) sb.Append(new string(' ', depth * 2)).Append(s); sb.Append('\n'); }
	string Todo(SyntaxNode n, string what) { world.Note(what); return $"__TODO__(/* {what}: {n.ToString().Replace("*/", "* /").ReplaceLineEndings(" ")} */)"; }
	static string Id(string name) => Reserved.Contains(name) ? name + "_" : name;
	string Use(string engineName) { engine.Add(engineName); return engineName; }

	static string Str(string value)
	{
		var q = value.Contains('\'') && !value.Contains('"') ? '"' : '\'';
		var b = new StringBuilder().Append(q);
		foreach (var c in value)
			b.Append(c switch { '\\' => "\\\\", '\n' => "\\n", '\r' => "\\r", '\t' => "\\t", '\0' => "\\0", _ => c == q ? "\\" + c : c.ToString() });
		return b.Append(q).ToString();
	}

	// ------------------------------------------------------------ types

	static bool IsUnity(ISymbol s) { var ns = s.ContainingNamespace?.ToDisplayString() ?? ""; return ns.StartsWith("UnityEngine") || ns.StartsWith("TMPro"); }
	static bool IsUnityObject(ITypeSymbol t) { for (; t != null; t = t.BaseType) if (t.Name == "Object" && t.ContainingNamespace?.ToDisplayString() == "UnityEngine") return true; return false; }
	static bool IsInt(ITypeSymbol t) => t != null && t.SpecialType is SpecialType.System_Int32 or SpecialType.System_Int64 or SpecialType.System_Int16 or SpecialType.System_Byte or SpecialType.System_UInt32 or SpecialType.System_UInt64 or SpecialType.System_UInt16 or SpecialType.System_SByte;
	static bool IsFloat(ITypeSymbol t) => t != null && t.SpecialType is SpecialType.System_Single or SpecialType.System_Double or SpecialType.System_Decimal;
	static bool IsNumber(ITypeSymbol t) => IsInt(t) || IsFloat(t);
	static bool IsString(ITypeSymbol t) => t?.SpecialType == SpecialType.System_String;
	static bool IsList(ITypeSymbol t) => t is INamedTypeSymbol n && n.Name == "List" && n.ContainingNamespace?.ToDisplayString() == "System.Collections.Generic";
	static bool IsCopiedStruct(ITypeSymbol t) => t != null && t.IsValueType && IsUnity(t) && CopiedStructs.Contains(t.Name);

	/// <summary>The name to use for a class in the generated code, importing it as needed.</summary>
	string TypeName(INamedTypeSymbol t, bool asValue)
	{
		if (IsUnity(t)) return Use(t.Name == "Object" ? "UObject" : t.Name);
		if (World.IsGame(t))
		{
			var file = Path.GetFileNameWithoutExtension(t.Locations.First(l => l.IsInSource).SourceTree.FilePath);
			if (file != fileName)
			{
				if (asValue && world.Lazy.Contains(t)) { gameTypesOnly.Add($"{t.Name}@{file}"); return $"{Use("lazyClass")}<typeof {t.Name}>({Str(t.Name)})"; }
				if (asValue) game.Add($"{t.Name}@{file}"); else gameTypesOnly.Add($"{t.Name}@{file}");
			}
			return t.Name;
		}
		return t.Name;
	}

	string TsType(ITypeSymbol t)
	{
		if (t == null) return "any";
		if (IsNumber(t)) return "number";
		switch (t.SpecialType)
		{
			case SpecialType.System_Boolean: return "boolean";
			case SpecialType.System_String: case SpecialType.System_Char: return "string";
			case SpecialType.System_Void: return "void";
			case SpecialType.System_Object: return "any";
		}
		if (t is IArrayTypeSymbol a) { var e = TsType(a.ElementType); if (e.Contains(' ')) e = $"({e})"; return e + string.Concat(Enumerable.Repeat("[]", a.Rank)); }
		if (t is INamedTypeSymbol n)
		{
			if (IsList(n)) { var e = TsType(n.TypeArguments[0]); return (e.Contains(' ') ? $"({e})" : e) + "[]"; }
			if (n.Name == "IEnumerator") return Use("Routine");
			if (n.Name == "Dictionary") return $"Map<{TsType(n.TypeArguments[0])}, {TsType(n.TypeArguments[1])}>";
			if (n.Name == "Nullable") return TsType(n.TypeArguments[0]) + " | null";
			if (n.TypeKind == TypeKind.Enum && !IsUnity(n) && !World.IsGame(n)) return "number";
			if (IsUnity(n) || World.IsGame(n)) return TypeName(n, false);
		}
		return "any";
	}

	/// <summary>What a field of this type holds when the C# code gives it no initial value.</summary>
	string DefaultValue(ITypeSymbol t, bool serialized)
	{
		if (IsNumber(t) || t.TypeKind == TypeKind.Enum) return "0";
		if (t.SpecialType == SpecialType.System_Boolean) return "false";
		if (t.SpecialType == SpecialType.System_Char) return "'\\0'";
		// Unity gives serialized strings and arrays a value even when the inspector left them empty.
		if (IsString(t)) return serialized ? "''" : "null";
		if ((t is IArrayTypeSymbol || IsList(t)) && serialized) return "[]";
		if (t.IsValueType && IsUnity(t))
		{
			var name = TypeName((INamedTypeSymbol)t, true);
			return t.Name is "Color" or "Quaternion" ? $"new {name}(0, 0, 0, 0)" : $"new {name}()";
		}
		return "null";
	}

	// ------------------------------------------------------------ file and classes

	public string File(CompilationUnitSyntax root)
	{
		foreach (var type in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
		{
			if (type is ClassDeclarationSyntax or StructDeclarationSyntax) Class((TypeDeclarationSyntax)type);
			else if (type is EnumDeclarationSyntax e) Enum(e);
			else Line(Todo(type, "type declaration"));
			Line();
		}
		var head = new StringBuilder();
		if (engine.Count > 0) head.Append($"import {{ {string.Join(", ", engine)} }} from '../engine';\n");
		foreach (var g in game.GroupBy(x => x.Split('@')[1]))
			head.Append($"import {{ {string.Join(", ", g.Select(x => x.Split('@')[0]))} }} from './{g.Key}';\n");
		foreach (var g in gameTypesOnly.Where(x => !game.Contains(x)).GroupBy(x => x.Split('@')[1]))
			head.Append($"import type {{ {string.Join(", ", g.Select(x => x.Split('@')[0]))} }} from './{g.Key}';\n");
		if (head.Length > 0) head.Append('\n');
		return head + sb.ToString().TrimEnd('\n') + "\n";
	}

	void Enum(EnumDeclarationSyntax e)
	{
		Line($"export enum {e.Identifier.Text} {{");
		depth++;
		foreach (var m in e.Members) Line($"{m.Identifier.Text}{(m.EqualsValue != null ? " = " + Expr(m.EqualsValue.Value) : "")},");
		depth--;
		Line("}");
	}

	string Access(ISymbol member, bool isMessage = false)
	{
		if (isMessage || world.Shared.Contains((member.ContainingType, member.Name))) return "";
		return member.DeclaredAccessibility switch { Accessibility.Private => "private ", Accessibility.Protected => "protected ", _ => "" };
	}

	void Class(TypeDeclarationSyntax decl)
	{
		var type = model.GetDeclaredSymbol(decl);
		var baseType = type.BaseType;
		var ext = baseType != null && baseType.SpecialType != SpecialType.System_Object && baseType.Name != "ValueType" ? $" extends {TypeName(baseType, true)}" : "";
		var hasBase = ext.Length > 0;
		Line($"export {(type.IsAbstract && !type.IsStatic ? "abstract " : "")}class {type.Name}{ext} {{");
		depth++;
		bool first = true;
		void Gap() { if (!first) Line(); first = false; }

		// Data read from JSON or from a scene arrives as plain objects; this tells the loader which class each one is.
		var dataFields = type.GetMembers().OfType<IFieldSymbol>().Where(f => !f.IsStatic).Select(f => (f.Name, Element: ElementClass(f.Type))).Where(x => x.Element != null).ToList();
		if (dataFields.Count > 0)
		{
			Line($"static readonly fieldTypes = {{ {string.Join(", ", dataFields.Select(x => $"{x.Name}: {TypeName(x.Element, true)}"))} }};");
			first = false;
		}

		foreach (var member in decl.Members)
		{
			switch (member)
			{
				case FieldDeclarationSyntax f:
					foreach (var v in f.Declaration.Variables)
					{
						var field = (IFieldSymbol)model.GetDeclaredSymbol(v);
						var serialized = !field.IsStatic && !field.IsConst && !field.IsReadOnly && (field.DeclaredAccessibility == Accessibility.Public || field.GetAttributes().Any(a => a.AttributeClass?.Name == "SerializeField"));
						var init = v.Initializer != null ? Val(v.Initializer.Value, copy: true) : DefaultValue(field.Type, serialized);
						var mods = Access(field) + (field.IsStatic || field.IsConst ? "static " : "") + (field.IsConst || field.IsReadOnly ? "readonly " : "");
						Line($"{mods}{field.Name}: {TsType(field.Type)} = {init};");
						first = false;
					}
					break;
				case PropertyDeclarationSyntax p:
					{
						var prop = model.GetDeclaredSymbol(p);
						var mods = Access(prop) + (prop.IsStatic ? "static " : "");
						if (p.AccessorList != null && p.AccessorList.Accessors.All(a => a.Body == null && a.ExpressionBody == null))
						{
							Line($"{mods}{prop.Name}: {TsType(prop.Type)} = {(p.Initializer != null ? Val(p.Initializer.Value, copy: true) : DefaultValue(prop.Type, false))};");
							first = false;
							break;
						}
						Gap();
						if (p.ExpressionBody != null) { Line($"{mods}get {prop.Name}(): {TsType(prop.Type)} {{ return {Val(p.ExpressionBody.Expression)}; }}"); break; }
						foreach (var acc in p.AccessorList.Accessors)
						{
							var isGet = acc.Keyword.IsKind(SyntaxKind.GetKeyword);
							Line(isGet ? $"{mods}get {prop.Name}(): {TsType(prop.Type)} {{" : $"{mods}set {prop.Name}(value: {TsType(prop.Type)}) {{");
							depth++;
							if (acc.Body != null) foreach (var s in acc.Body.Statements) Statement(s);
							else Line(isGet ? $"return {Val(acc.ExpressionBody.Expression)};" : $"{Expr(acc.ExpressionBody.Expression)};");
							depth--;
							Line("}");
						}
						break;
					}
				case ConstructorDeclarationSyntax c:
					{
						Gap();
						var ctor = model.GetDeclaredSymbol(c);
						Line($"constructor({Parameters(c.ParameterList)}) {{");
						depth++;
						if (hasBase) Line($"super({(c.Initializer != null && c.Initializer.ThisOrBaseKeyword.IsKind(SyntaxKind.BaseKeyword) ? Arguments(c.Initializer.ArgumentList, (IMethodSymbol)model.GetSymbolInfo(c.Initializer).Symbol) : "")});");
						if (c.Body != null) foreach (var s in c.Body.Statements) Statement(s);
						depth--;
						Line("}");
						break;
					}
				case MethodDeclarationSyntax m:
					{
						Gap();
						var method = model.GetDeclaredSymbol(m);
						var name = world.Renamed.GetValueOrDefault(method, method.Name);
						var isRoutine = method.ReturnType.Name == "IEnumerator" && m.DescendantNodes().OfType<YieldStatementSyntax>().Any();
						var mods = Access(method, UnityMessages.Contains(method.Name)) + (method.IsStatic ? "static " : "") + (method.IsAbstract ? "abstract " : "");
						var signature = $"{mods}{(isRoutine ? "*" : "")}{name}({Parameters(m.ParameterList)}): {TsType(method.ReturnType)}";
						if (m.Body == null && m.ExpressionBody == null) { Line(signature + ";"); break; }
						Line(signature + " {");
						depth++;
						if (m.Body != null) foreach (var s in m.Body.Statements) Statement(s);
						else Line(method.ReturnsVoid ? $"{Expr(m.ExpressionBody.Expression)};" : $"return {Val(m.ExpressionBody.Expression, copy: true)};");
						depth--;
						Line("}");
						break;
					}
				case BaseTypeDeclarationSyntax:
					break; // nested types are emitted at the top level by File()
				default:
					Line(Todo(member, "member " + member.Kind()));
					break;
			}
		}
		depth--;
		Line("}");
	}

	/// <summary>The game data class a field holds (directly, or as array or list elements), if any.</summary>
	static INamedTypeSymbol ElementClass(ITypeSymbol t)
	{
		if (t is IArrayTypeSymbol a) t = a.ElementType;
		else if (IsList(t)) t = ((INamedTypeSymbol)t).TypeArguments[0];
		return t is INamedTypeSymbol n && World.IsGame(n) && n.TypeKind == TypeKind.Class && !IsUnityObject(n) && !n.IsStatic ? n : null;
	}

	string Parameters(ParameterListSyntax list) => string.Join(", ", list.Parameters.Select(p =>
	{
		var sym = model.GetDeclaredSymbol(p);
		return $"{Id(p.Identifier.Text)}: {TsType(sym.Type)}{(p.Default != null ? " = " + Val(p.Default.Value) : "")}";
	}));

	// ------------------------------------------------------------ statements

	void Block(StatementSyntax s)
	{
		if (s is BlockSyntax b) foreach (var x in b.Statements) Statement(x);
		else Statement(s);
	}

	void Statement(StatementSyntax s)
	{
		switch (s)
		{
			case BlockSyntax b:
				Line("{"); depth++; foreach (var x in b.Statements) Statement(x); depth--; Line("}");
				break;
			case LocalDeclarationStatementSyntax l:
				Line(Declaration(l.Declaration, l.IsConst) + ";");
				break;
			case ExpressionStatementSyntax e:
				// `_ = value;` only exists to evaluate something; keep it if that something is a call.
				if (e.Expression is AssignmentExpressionSyntax { Left: IdentifierNameSyntax { Identifier.Text: "_" } } discard && model.GetSymbolInfo(discard.Left).Symbol is IDiscardSymbol or null)
				{
					if (discard.Right.DescendantNodesAndSelf().OfType<InvocationExpressionSyntax>().Any()) Line(Expr(discard.Right) + ";");
					break;
				}
				Line(Expr(e.Expression) + ";");
				break;
			case IfStatementSyntax i:
				IfChain(i, "if");
				break;
			case WhileStatementSyntax w:
				Line($"while ({Val(w.Condition)}) {{"); depth++; Block(w.Statement); depth--; Line("}");
				break;
			case DoStatementSyntax d:
				Line("do {"); depth++; Block(d.Statement); depth--; Line($"}} while ({Val(d.Condition)});");
				break;
			case ForStatementSyntax f:
				{
					var init = f.Declaration != null ? Declaration(f.Declaration, false) : string.Join(", ", f.Initializers.Select(Expr));
					Line($"for ({init}; {(f.Condition != null ? Val(f.Condition) : "")}; {string.Join(", ", f.Incrementors.Select(Expr))}) {{");
					depth++; Block(f.Statement); depth--; Line("}");
					break;
				}
			case ForEachStatementSyntax fe:
				Line($"for (const {Id(fe.Identifier.Text)} of {Val(fe.Expression)}) {{"); depth++; Block(fe.Statement); depth--; Line("}");
				break;
			case SwitchStatementSyntax sw:
				Line($"switch ({Val(sw.Expression)}) {{");
				depth++;
				foreach (var section in sw.Sections)
				{
					foreach (var label in section.Labels)
						Line(label is CaseSwitchLabelSyntax c ? $"case {Val(c.Value)}:" : label is DefaultSwitchLabelSyntax ? "default:" : Todo(label, "switch label"));
					depth++;
					var needsScope = section.Statements.OfType<LocalDeclarationStatementSyntax>().Any();
					if (needsScope) { Line("{"); depth++; }
					foreach (var x in section.Statements) Statement(x);
					if (needsScope) { depth--; Line("}"); }
					depth--;
				}
				depth--;
				Line("}");
				break;
			case ReturnStatementSyntax r:
				Line(r.Expression == null ? "return;" : $"return {Val(r.Expression, copy: true)};");
				break;
			case BreakStatementSyntax: Line("break;"); break;
			case ContinueStatementSyntax: Line("continue;"); break;
			case EmptyStatementSyntax: break;
			case YieldStatementSyntax y:
				Line(y.ReturnOrBreakKeyword.IsKind(SyntaxKind.BreakKeyword) ? "return;" : $"yield {Val(y.Expression)};");
				break;
			case ThrowStatementSyntax t:
				Line($"throw {(t.Expression != null ? Val(t.Expression) : "new Error()")};");
				break;
			default:
				Line(Todo(s, "statement " + s.Kind()) + ";");
				break;
		}
	}

	void IfChain(IfStatementSyntax i, string keyword)
	{
		Line($"{keyword} ({Val(i.Condition)}) {{");
		depth++; Block(i.Statement); depth--;
		if (i.Else == null) { Line("}"); return; }
		if (i.Else.Statement is IfStatementSyntax next) { IfChain(next, "} else if"); return; }
		Line("} else {"); depth++; Block(i.Else.Statement); depth--; Line("}");
	}

	string Declaration(VariableDeclarationSyntax d, bool isConst)
	{
		var type = model.GetTypeInfo(d.Type).Type;
		return (isConst ? "const " : "let ") + string.Join(", ", d.Variables.Select(v =>
			$"{Id(v.Identifier.Text)}: {TsType(type)}" + (v.Initializer != null ? " = " + Val(v.Initializer.Value, copy: true) : "")));
	}

	// ------------------------------------------------------------ expressions

	/// <summary>Wraps an expression in parentheses unless it already binds as tightly as a name or a call.</summary>
	static string Paren(string s)
	{
		if (s.Length == 0 || s[0] is '!' or '-' or '+' or '~' || s.StartsWith("new ")) return $"({s})";
		int depth = 0; char quote = '\0';
		for (int i = 0; i < s.Length; i++)
		{
			var c = s[i];
			if (quote != '\0') { if (c == '\\') i++; else if (c == quote) quote = '\0'; continue; }
			if (c is '\'' or '"' or '`') { quote = c; continue; }
			if (c is '(' or '[' or '{') depth++;
			else if (c is ')' or ']' or '}') depth--;
			else if (depth == 0 && (c == ' ' || "+-*/%<>=!&|?:,".Contains(c))) return $"({s})";
		}
		return s;
	}

	/// <summary>An expression as a value: with the implicit conversion C# applies in its context, and copied if it is a struct that would otherwise be shared.</summary>
	string Val(ExpressionSyntax e, bool copy = false)
	{
		var s = Expr(e);
		var conv = model.GetConversion(e);
		var info = model.GetTypeInfo(e);
		if (conv.IsUserDefined && conv.MethodSymbol != null)
		{
			var from = conv.MethodSymbol.Parameters[0].Type; var to = conv.MethodSymbol.ReturnType;
			if (to.SpecialType == SpecialType.System_Boolean && IsUnityObject(from)) return $"{Use("alive")}({s})";
			if (from.Name == "Vector3" && to.Name == "Vector2") return $"{Paren(s)}.toVector2()";
			if (from.Name == "Vector2" && to.Name == "Vector3") return $"{Paren(s)}.toVector3()";
			if (from.Name is "Color32" or "Color" && to.Name is "Color32" or "Color") return s;
			return Todo(e, $"conversion {from.Name}->{to.Name}");
		}
		if (copy && IsCopiedStruct(info.Type) && IsStoredValue(e)) return $"{Paren(s)}.clone()";
		return s;
	}

	/// <summary>True for an expression that names a stored value (a variable, field or array slot) rather than computing a fresh one.</summary>
	bool IsStoredValue(ExpressionSyntax e)
	{
		while (e is ParenthesizedExpressionSyntax p) e = p.Expression;
		if (e is ElementAccessExpressionSyntax) return true;
		if (e is not (IdentifierNameSyntax or MemberAccessExpressionSyntax)) return false;
		return model.GetSymbolInfo(e).Symbol is ILocalSymbol or IParameterSymbol or IFieldSymbol { IsStatic: false };
	}

	string Expr(ExpressionSyntax e)
	{
		switch (e)
		{
			case ParenthesizedExpressionSyntax p: return $"({Val(p.Expression)})";
			case LiteralExpressionSyntax lit: return Literal(lit);
			case ThisExpressionSyntax: return "this";
			case BaseExpressionSyntax: return "this";
			case IdentifierNameSyntax id: return Identifier(id);
			case GenericNameSyntax g: return Identifier(g);
			case PredefinedTypeSyntax pt: return pt.Keyword.Text;
			case MemberAccessExpressionSyntax ma: return MemberAccess(ma);
			case InvocationExpressionSyntax inv: return Invocation(inv);
			case ObjectCreationExpressionSyntax oc: return Creation(oc);
			case ArrayCreationExpressionSyntax ac: return ArrayCreation(ac);
			case ImplicitArrayCreationExpressionSyntax iac: return $"[{string.Join(", ", iac.Initializer.Expressions.Select(x => Val(x, copy: true)))}]";
			case InitializerExpressionSyntax init: return $"[{string.Join(", ", init.Expressions.Select(x => Val(x, copy: true)))}]";
			case ElementAccessExpressionSyntax ea: return Paren(Val(ea.Expression)) + string.Concat(ea.ArgumentList.Arguments.Select(a => $"[{Val(a.Expression)}]"));
			case AssignmentExpressionSyntax asg: return Assignment(asg);
			case BinaryExpressionSyntax bin: return Binary(bin);
			case PrefixUnaryExpressionSyntax pre: return Prefix(pre);
			case PostfixUnaryExpressionSyntax post: return Val(post.Operand) + post.OperatorToken.Text;
			case ConditionalExpressionSyntax c: return $"{Val(c.Condition)} ? {Val(c.WhenTrue, copy: true)} : {Val(c.WhenFalse, copy: true)}";
			case CastExpressionSyntax cast: return Cast(cast);
			case TypeOfExpressionSyntax t: return model.GetTypeInfo(t.Type).Type is INamedTypeSymbol n ? TypeName(n, true) : Todo(e, "typeof");
			case DefaultExpressionSyntax d: { var t = model.GetTypeInfo(d.Type).Type; return DefaultValue(t, false); }
			default: return Todo(e, "expression " + e.Kind());
		}
	}

	string Literal(LiteralExpressionSyntax lit)
	{
		switch (lit.Kind())
		{
			case SyntaxKind.NullLiteralExpression: return "null";
			case SyntaxKind.TrueLiteralExpression: return "true";
			case SyntaxKind.FalseLiteralExpression: return "false";
			case SyntaxKind.StringLiteralExpression: return Str(lit.Token.ValueText);
			case SyntaxKind.CharacterLiteralExpression: return Str(lit.Token.ValueText);
			case SyntaxKind.DefaultLiteralExpression: return DefaultValue(model.GetTypeInfo(lit).ConvertedType, false);
			case SyntaxKind.NumericLiteralExpression:
				{
					var text = lit.Token.Text.Replace("_", "");
					if (!text.StartsWith("0x", StringComparison.OrdinalIgnoreCase)) text = text.TrimEnd('f', 'F', 'd', 'D', 'm', 'M', 'l', 'L', 'u', 'U');
					return text;
				}
		}
		return Todo(lit, "literal");
	}

	/// <summary>A name used on its own: a local, or a member of this class that C# lets you write without `this`.</summary>
	string Identifier(SimpleNameSyntax id)
	{
		var sym = model.GetSymbolInfo(id).Symbol ?? model.GetSymbolInfo(id).CandidateSymbols.FirstOrDefault();
		switch (sym)
		{
			case ILocalSymbol or IParameterSymbol: return Id(id.Identifier.Text);
			case INamedTypeSymbol t: return TypeName(t, true);
			case IMethodSymbol m: { var name = world.Renamed.GetValueOrDefault(m.OriginalDefinition, m.Name); return m.IsStatic ? $"{TypeName(m.ContainingType, true)}.{name}" : $"this.{name}"; }
			case IFieldSymbol or IPropertySymbol or IEventSymbol:
				return MemberOf(sym, sym.IsStatic ? TypeName(sym.ContainingType, true) : "this");
		}
		return Todo(id, "identifier");
	}

	/// <summary>Reads member `sym` of `receiver`, renaming the .NET members that have a different name in JavaScript.</summary>
	string MemberOf(ISymbol sym, string receiver)
	{
		var owner = sym.ContainingType;
		if (sym.Name == "Length" && (owner?.SpecialType == SpecialType.System_String || owner?.Name == "Array")) return $"{receiver}.length";
		if (sym.Name == "Count" && owner != null && IsList(owner.OriginalDefinition)) return $"{receiver}.length";
		if (sym.Name == "Empty" && owner?.SpecialType == SpecialType.System_String) return "''";
		if (owner?.SpecialType is SpecialType.System_Int32 or SpecialType.System_Single && sym.Name is "MaxValue" or "MinValue")
			return owner.SpecialType == SpecialType.System_Int32 ? (sym.Name == "MaxValue" ? "2147483647" : "-2147483648") : (sym.Name == "MaxValue" ? "3.4028235e38" : "-3.4028235e38");
		return $"{receiver}.{sym.Name}";
	}

	string MemberAccess(MemberAccessExpressionSyntax ma)
	{
		var sym = model.GetSymbolInfo(ma).Symbol ?? model.GetSymbolInfo(ma).CandidateSymbols.FirstOrDefault();
		if (sym is INamedTypeSymbol type) return TypeName(type, true);
		if (sym is IMethodSymbol m)
		{
			var name = world.Renamed.GetValueOrDefault(m.OriginalDefinition, m.Name);
			return m.IsStatic ? $"{TypeName(m.ContainingType, true)}.{name}" : $"{Paren(Val(ma.Expression))}.{name}";
		}
		if (sym == null) return Todo(ma, "member access");
		if (sym.IsStatic) return MemberOf(sym, TypeName(sym.ContainingType, true));
		return MemberOf(sym, Paren(Val(ma.Expression)));
	}

	/// <summary>Arguments in declaration order, so that C#'s named arguments work.</summary>
	string Arguments(ArgumentListSyntax list, IMethodSymbol method) => string.Join(", ", ArgList(list, method));

	List<string> ArgList(ArgumentListSyntax list, IMethodSymbol method)
	{
		var args = list.Arguments;
		if (method == null || args.All(a => a.NameColon == null)) return args.Select(a => Val(a.Expression)).ToList();
		var slots = new string[method.Parameters.Length];
		for (int i = 0; i < args.Count; i++)
		{
			var index = args[i].NameColon != null ? method.Parameters.ToList().FindIndex(p => p.Name == args[i].NameColon.Name.Identifier.Text) : i;
			if (index >= 0 && index < slots.Length) slots[index] = Val(args[i].Expression);
		}
		var last = Array.FindLastIndex(slots, s => s != null);
		return slots.Take(last + 1).Select(s => s ?? "undefined").ToList();
	}

	string Invocation(InvocationExpressionSyntax inv)
	{
		var method = (model.GetSymbolInfo(inv).Symbol ?? model.GetSymbolInfo(inv).CandidateSymbols.FirstOrDefault()) as IMethodSymbol;
		if (method == null) return Todo(inv, "call");
		var args = ArgList(inv.ArgumentList, method);
		var owner = method.ContainingType;
		var ownerName = owner.ToDisplayString();
		var receiverSyntax = (inv.Expression as MemberAccessExpressionSyntax)?.Expression;
		string Receiver() => receiverSyntax != null ? Paren(Val(receiverSyntax)) : "this";
		var receiverType = receiverSyntax != null ? model.GetTypeInfo(receiverSyntax).Type : null;
		string TypeArg(int i = 0) => method.TypeArguments.Length > i && method.TypeArguments[i] is INamedTypeSymbol n ? TypeName(n, true) : "undefined";
		var all = string.Join(", ", args);

		// --- Unity
		if (IsUnity(method))
		{
			switch (method.Name)
			{
				case "GetComponent" or "GetComponentInChildren" or "GetComponentInParent" or "GetComponents" or "GetComponentsInChildren" or "AddComponent" when method.IsGenericMethod:
					return $"{Receiver()}.{method.Name}({string.Join(", ", new[] { TypeArg() }.Concat(args))})";
				case "Instantiate" when owner.Name == "Object": return $"{Use("Instantiate")}({all})";
				case "Destroy" or "DestroyImmediate" when owner.Name == "Object": return $"{Use("UObject")}.{method.Name}({all})";
				case "DontDestroyOnLoad" when owner.Name == "Object": return $"{Use("DontDestroyOnLoad")}({all})";
				case "FindObjectOfType" or "FindObjectsOfType" when owner.Name == "Object":
					return $"{Use("UObject")}.{method.Name}({(method.IsGenericMethod ? TypeArg() : all)})";
				case "Load" or "LoadAsync" when owner.Name == "Resources" && method.IsGenericMethod: return $"{Use("Resources")}.{method.Name}({all}, {TypeArg()})";
				case "FromJson" when owner.Name == "JsonUtility": return $"{Use("JsonUtility")}.FromJson({all}, {TypeArg()})";
				case "Range" when owner.Name == "Random" && IsInt(method.ReturnType): return $"{Use("Random")}.RangeInt({all})";
				case "ToString" when args.Count == 0: return $"String({Receiver()})";
			}
		}

		// --- .NET
		if (method.Name == "ToString" && receiverSyntax != null)
		{
			if (args.Count == 1) return $"{Use("formatNumber")}({Receiver()}, {args[0]})";
			if (IsFloat(receiverType)) return $"{Use("floatString")}({Receiver()})";
			if (IsString(receiverType) || receiverType?.SpecialType == SpecialType.System_Char) return Receiver();
			if (receiverType?.SpecialType == SpecialType.System_Boolean) return $"({Receiver()} ? 'True' : 'False')";
			return $"String({Receiver()})";
		}
		if (owner.SpecialType == SpecialType.System_String)
		{
			switch (method.Name)
			{
				case "Contains": return $"{Receiver()}.includes({all})";
				case "Replace": return $"{Receiver()}.replaceAll({all})";
				case "Split": return $"{Receiver()}.split({args[0]})";
				case "StartsWith": return $"{Receiver()}.startsWith({all})";
				case "EndsWith": return $"{Receiver()}.endsWith({all})";
				case "ToLower" or "ToLowerInvariant": return $"{Receiver()}.toLowerCase()";
				case "ToUpper" or "ToUpperInvariant": return $"{Receiver()}.toUpperCase()";
				case "Trim": return $"{Receiver()}.trim()";
				case "IndexOf": return $"{Receiver()}.indexOf({all})";
				case "Substring": return args.Count == 1 ? $"{Receiver()}.substring({args[0]})" : $"{Receiver()}.substr({all})";
				case "Equals": return $"({Receiver()} === {args[0]})";
				case "IsNullOrEmpty": return $"!{Paren(args[0])}";
				case "Concat": return $"('' + {string.Join(" + ", args)})";
				case "Join": return $"{Paren(args[1])}.join({args[0]})";
			}
		}
		if (owner.SpecialType == SpecialType.System_Char && method.Name == "ToString") return args.Count > 0 ? args[0] : Receiver();
		if (owner.SpecialType is SpecialType.System_Int32 or SpecialType.System_Int64 && method.Name == "Parse") return $"parseInt({args[0]}, 10)";
		if (owner.SpecialType is SpecialType.System_Single or SpecialType.System_Double && method.Name == "Parse") return $"parseFloat({args[0]})";
		if (ownerName == "System.Math")
		{
			switch (method.Name)
			{
				case "Round": return args.Count == 1 ? $"{Use("Mathf")}.Round({all})" : $"{Use("roundDigits")}({all})";
				case "Abs" or "Min" or "Max" or "Floor" or "Sqrt" or "Pow" or "Sin" or "Cos": return $"Math.{method.Name.ToLowerInvariant()}({all})";
				case "Ceiling": return $"Math.ceil({all})";
			}
		}
		if (IsList(owner.OriginalDefinition))
		{
			switch (method.Name)
			{
				case "Add": return $"{Receiver()}.push({all})";
				case "AddRange": return $"{Receiver()}.push(...{all})";
				case "Clear": return $"{Receiver()}.length = 0";
				case "Contains": return $"{Receiver()}.includes({all})";
				case "IndexOf": return $"{Receiver()}.indexOf({all})";
				case "Remove": return $"{Use("listRemove")}({Receiver()}, {all})";
				case "RemoveAt": return $"{Receiver()}.splice({args[0]}, 1)";
				case "Insert": return $"{Receiver()}.splice({args[0]}, 0, {args[1]})";
				case "ToArray": return $"{Receiver()}.slice()";
				case "Reverse": return $"{Receiver()}.reverse()";
				case "Sort" when args.Count == 0: return IsNumber(owner.TypeArguments[0]) ? $"{Receiver()}.sort((a, b) => a - b)" : $"{Receiver()}.sort()";
			}
		}
		if (ownerName == "System.Array")
		{
			switch (method.Name)
			{
				case "GetLength": return args[0] == "0" ? $"{Receiver()}.length" : $"{Receiver()}[0].length";
				case "Copy" when args.Count == 3: return $"{Use("arrayCopy")}({args[0]}, 0, {args[1]}, 0, {args[2]})";
				case "Copy" when args.Count == 5: return $"{Use("arrayCopy")}({all})";
				case "Clone": return $"{Receiver()}.slice()";
			}
		}
		if (!IsUnity(method) && !World.IsGame(owner)) return Todo(inv, $"call {ownerName}.{method.Name}");

		// --- everything else: a call on the engine or on the game's own classes
		return $"{Expr(inv.Expression)}({all})";
	}

	string Creation(ObjectCreationExpressionSyntax oc)
	{
		var type = model.GetTypeInfo(oc).Type as INamedTypeSymbol;
		var ctor = model.GetSymbolInfo(oc).Symbol as IMethodSymbol;
		var args = oc.ArgumentList != null ? ArgList(oc.ArgumentList, ctor) : new List<string>();
		if (type == null) return Todo(oc, "new");
		if (IsList(type))
		{
			if (oc.Initializer != null) return $"[{string.Join(", ", oc.Initializer.Expressions.Select(x => Val(x, copy: true)))}]";
			return ctor != null && ctor.Parameters.Length == 1 && !IsInt(ctor.Parameters[0].Type) ? $"[...{args[0]}]" : "[]";
		}
		if (type.Name == "Dictionary") return "new Map()";
		if (type.Name == "Color32" && IsUnity(type)) return $"{Use("Color32")}({string.Join(", ", args)})";
		if (!IsUnity(type) && !World.IsGame(type)) return Todo(oc, $"new {type.ToDisplayString()}");
		var created = $"new {TypeName(type, true)}({string.Join(", ", args)})";
		if (oc.Initializer == null) return created;
		var sets = oc.Initializer.Expressions.OfType<AssignmentExpressionSyntax>().Select(a => $"{((IdentifierNameSyntax)a.Left).Identifier.Text}: {Val(a.Right, copy: true)}");
		return $"Object.assign({created}, {{ {string.Join(", ", sets)} }})";
	}

	string ArrayCreation(ArrayCreationExpressionSyntax ac)
	{
		var type = (IArrayTypeSymbol)model.GetTypeInfo(ac).Type;
		if (ac.Initializer != null) return Expr(ac.Initializer);
		var sizes = ac.Type.RankSpecifiers[0].Sizes.Select(x => Val(x)).ToList();
		var el = type.ElementType;
		var fill = IsCopiedStruct(el) ? null : DefaultValue(el, false);
		string Make(int i)
		{
			if (i == sizes.Count - 1) return fill != null ? $"new Array({sizes[i]}).fill({fill})" : $"Array.from({{ length: {sizes[i]} }}, () => {DefaultValue(el, false)})";
			return $"Array.from({{ length: {sizes[i]} }}, () => {Make(i + 1)})";
		}
		return Make(0);
	}

	string Cast(CastExpressionSyntax cast)
	{
		var to = model.GetTypeInfo(cast.Type).Type;
		var from = model.GetTypeInfo(cast.Expression).Type;
		var inner = Val(cast.Expression);
		if (to.SpecialType == SpecialType.System_Boolean && IsUnityObject(from)) return inner.StartsWith("alive(") ? inner : $"{Use("alive")}({inner})";
		if (IsInt(to))
		{
			if (IsFloat(from)) return $"Math.trunc({inner})";
			if (from?.SpecialType == SpecialType.System_Char) return $"{Paren(inner)}.charCodeAt(0)";
			return inner;
		}
		if (IsFloat(to)) return inner;
		if (to.SpecialType == SpecialType.System_Char && IsInt(from)) return $"String.fromCharCode({inner})";
		return $"({inner} as {TsType(to)})";
	}

	static readonly Dictionary<string, string> VectorOps = new() { ["op_Addition"] = "add", ["op_Subtraction"] = "sub", ["op_Multiply"] = "mul", ["op_Division"] = "div" };

	/// <summary>Text for one side of a string concatenation: C# formats floats and booleans differently from JavaScript.</summary>
	string ForConcat(ExpressionSyntax e)
	{
		var t = model.GetTypeInfo(e).Type;
		var s = Val(e);
		if (IsFloat(t)) return $"{Use("floatString")}({s})";
		if (t?.SpecialType == SpecialType.System_Boolean) return $"({s} ? 'True' : 'False')";
		return e is BinaryExpressionSyntax or ConditionalExpressionSyntax && !IsString(t) ? $"({s})" : s;
	}

	string Binary(BinaryExpressionSyntax bin)
	{
		var op = bin.OperatorToken.Text;
		if (bin.IsKind(SyntaxKind.AsExpression)) return Val(bin.Left);
		if (bin.IsKind(SyntaxKind.IsExpression)) return model.GetTypeInfo(bin.Right).Type is INamedTypeSymbol n ? $"({Val(bin.Left)} instanceof {TypeName(n, true)})" : Todo(bin, "is");
		var method = model.GetSymbolInfo(bin).Symbol as IMethodSymbol;
		var type = model.GetTypeInfo(bin).Type;
		var lt = model.GetTypeInfo(bin.Left).Type; var rt = model.GetTypeInfo(bin.Right).Type;

		if (method != null && method.MethodKind == MethodKind.UserDefinedOperator)
		{
			var owner = method.ContainingType;
			if (method.Name is "op_Equality" or "op_Inequality")
			{
				var eq = method.Name == "op_Equality";
				if (IsUnityObject(owner))
				{
					// Unity treats a destroyed object as equal to null.
					if (bin.Right.IsKind(SyntaxKind.NullLiteralExpression)) return $"{(eq ? "!" : "")}{Use("alive")}({Expr(bin.Left)})";
					if (bin.Left.IsKind(SyntaxKind.NullLiteralExpression)) return $"{(eq ? "!" : "")}{Use("alive")}({Expr(bin.Right)})";
					return $"{Expr(bin.Left)} {(eq ? "===" : "!==")} {Expr(bin.Right)}";
				}
				return $"{(eq ? "" : "!")}{Paren(Val(bin.Left))}.equals({Val(bin.Right)})";
			}
			if (VectorOps.TryGetValue(method.Name, out var name))
			{
				// number * vector is written vector.mul(number)
				if (IsNumber(lt)) return $"{Paren(Val(bin.Right))}.{name}({Val(bin.Left)})";
				if (owner.Name == "Quaternion" && rt?.Name == "Vector3") return $"{Paren(Val(bin.Left))}.rotate({Val(bin.Right)})";
				return $"{Paren(Val(bin.Left))}.{name}({Val(bin.Right)})";
			}
			return Todo(bin, $"operator {owner.Name}.{method.Name}");
		}

		if (op == "+" && IsString(type)) return $"{ForConcat(bin.Left)} + {ForConcat(bin.Right)}";
		string l = Val(bin.Left), r = Val(bin.Right);
		if (op == "/" && IsInt(type)) return $"Math.trunc({l} / {r})";
		// C#'s non-short-circuiting & and | on booleans; the operands here have no side effects that depend on it.
		if (op is "&" or "|" && type?.SpecialType == SpecialType.System_Boolean) return $"{l} {op}{op} {r}";
		if (op is "==" or "!=")
		{
			var strict = !bin.Left.IsKind(SyntaxKind.NullLiteralExpression) && !bin.Right.IsKind(SyntaxKind.NullLiteralExpression);
			return $"{l} {op}{(strict ? "=" : "")} {r}";
		}
		return $"{l} {op} {r}";
	}

	string Prefix(PrefixUnaryExpressionSyntax pre)
	{
		var method = model.GetSymbolInfo(pre).Symbol as IMethodSymbol;
		if (method != null && method.MethodKind == MethodKind.UserDefinedOperator)
		{
			if (method.Name == "op_UnaryNegation") return $"{Paren(Val(pre.Operand))}.neg()";
			if (method.Name == "op_LogicalNot" && IsUnityObject(method.ContainingType)) return $"!{Use("alive")}({Expr(pre.Operand)})";
			return Todo(pre, $"operator {method.Name}");
		}
		var operand = Val(pre.Operand);
		return pre.OperatorToken.Text + (pre.Operand is BinaryExpressionSyntax or ConditionalExpressionSyntax or AssignmentExpressionSyntax or CastExpressionSyntax ? $"({operand})" : operand);
	}

	string Assignment(AssignmentExpressionSyntax asg)
	{
		var left = Expr(asg.Left);
		var lt = model.GetTypeInfo(asg.Left).Type;
		var leftSym = model.GetSymbolInfo(asg.Left).Symbol;
		if (leftSym is IEventSymbol)
		{
			if (asg.IsKind(SyntaxKind.AddAssignmentExpression)) return $"{left}.add({Handler(asg.Right)})";
			if (asg.IsKind(SyntaxKind.SubtractAssignmentExpression)) return $"{left}.remove({Handler(asg.Right)})";
		}
		if (asg.IsKind(SyntaxKind.SimpleAssignmentExpression)) return $"{left} = {Val(asg.Right, copy: true)}";

		var op = asg.OperatorToken.Text[..^1];
		var method = model.GetSymbolInfo(asg).Symbol as IMethodSymbol;
		if (method != null && method.MethodKind == MethodKind.UserDefinedOperator && VectorOps.TryGetValue(method.Name, out var name))
			return $"{left} = {left}.{name}({Val(asg.Right)})";
		if (op == "+" && IsString(lt)) return $"{left} += {ForConcat(asg.Right)}";
		if (op == "/" && IsInt(lt)) return $"{left} = Math.trunc({left} / {Paren(Val(asg.Right))})";
		// C# converts the result back to the variable's type: an int that has a float added stays an int.
		if (IsInt(lt) && IsFloat(model.GetTypeInfo(asg.Right).Type)) return $"{left} = Math.trunc({left} {op} {Paren(Val(asg.Right))})";
		return $"{left} {asg.OperatorToken.Text} {Val(asg.Right)}";
	}

	/// <summary>A method used as a value (an event handler) has to keep its `this`.</summary>
	string Handler(ExpressionSyntax e)
	{
		var s = Expr(e);
		return model.GetSymbolInfo(e).Symbol is IMethodSymbol { IsStatic: false } ? $"{s}.bind(this)" : s;
	}
}
