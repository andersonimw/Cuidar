// Base de interações medicamentosas comuns em idosos
// Fonte: referências farmacológicas gerais
// ATENÇÃO: não substitui orientação médica

var INTERACOES = [
  {
    medicamentos: ['warfarina', 'aspirina', 'aas'],
    risco: 'ALTO',
    descricao: 'Warfarina + Aspirina aumenta risco de sangramento grave.'
  },
  {
    medicamentos: ['warfarina', 'ibuprofeno'],
    risco: 'ALTO',
    descricao: 'Warfarina + Ibuprofeno aumenta risco de sangramento.'
  },
  {
    medicamentos: ['warfarina', 'paracetamol'],
    risco: 'MEDIO',
    descricao: 'Uso frequente de Paracetamol pode potencializar efeito da Warfarina.'
  },
  {
    medicamentos: ['captopril', 'enalapril', 'losartana', 'espironolactona'],
    risco: 'ALTO',
    descricao: 'Combinação de anti-hipertensivos pode causar queda brusca de pressão.'
  },
  {
    medicamentos: ['metformina', 'contraste', 'iodo'],
    risco: 'ALTO',
    descricao: 'Metformina + contraste iodado pode causar insuficiência renal aguda.'
  },
  {
    medicamentos: ['digoxina', 'amiodarona'],
    risco: 'ALTO',
    descricao: 'Amiodarona aumenta nível de Digoxina no sangue — risco de toxicidade.'
  },
  {
    medicamentos: ['digoxina', 'furosemida'],
    risco: 'MEDIO',
    descricao: 'Furosemida pode causar perda de potássio, aumentando toxicidade da Digoxina.'
  },
  {
    medicamentos: ['atenolol', 'metoprolol', 'propranolol', 'verapamil'],
    risco: 'ALTO',
    descricao: 'Beta-bloqueador + Verapamil pode causar bloqueio cardíaco grave.'
  },
  {
    medicamentos: ['atenolol', 'metoprolol', 'propranolol', 'diltiazem'],
    risco: 'MEDIO',
    descricao: 'Beta-bloqueador + Diltiazem pode causar bradicardia.'
  },
  {
    medicamentos: ['sinvastatina', 'atorvastatina', 'fluconazol'],
    risco: 'ALTO',
    descricao: 'Fluconazol aumenta nível das estatinas — risco de lesão muscular grave.'
  },
  {
    medicamentos: ['sinvastatina', 'atorvastatina', 'eritromicina', 'claritromicina'],
    risco: 'MEDIO',
    descricao: 'Antibióticos macrolídeos aumentam nível das estatinas no sangue.'
  },
  {
    medicamentos: ['tramadol', 'sertralina', 'fluoxetina', 'paroxetina'],
    risco: 'ALTO',
    descricao: 'Tramadol + antidepressivo ISRS pode causar síndrome serotoninérgica.'
  },
  {
    medicamentos: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'captopril', 'enalapril', 'losartana'],
    risco: 'MEDIO',
    descricao: 'Anti-inflamatórios reduzem efeito dos anti-hipertensivos e sobrecarregam os rins.'
  },
  {
    medicamentos: ['ibuprofeno', 'naproxeno', 'diclofenaco', 'furosemida'],
    risco: 'MEDIO',
    descricao: 'Anti-inflamatórios reduzem efeito do diurético e podem sobrecarregar os rins.'
  },
  {
    medicamentos: ['omeprazol', 'clopidogrel'],
    risco: 'MEDIO',
    descricao: 'Omeprazol pode reduzir efeito do Clopidogrel — risco cardiovascular.'
  },
  {
    medicamentos: ['glibenclamida', 'glicazida', 'glimepirida', 'fluconazol'],
    risco: 'ALTO',
    descricao: 'Fluconazol potencializa hipoglicemiantes — risco de hipoglicemia grave.'
  },
  {
    medicamentos: ['levotiroxina', 'carbonato de calcio', 'calcio'],
    risco: 'MEDIO',
    descricao: 'Cálcio reduz absorção da Levotiroxina. Tomar com intervalo de 4 horas.'
  },
  {
    medicamentos: ['levotiroxina', 'omeprazol', 'pantoprazol'],
    risco: 'MEDIO',
    descricao: 'Inibidores de bomba reduzem absorção da Levotiroxina.'
  },
  {
    medicamentos: ['ciprofloxacino', 'norfloxacino', 'theophylina', 'teofilina'],
    risco: 'ALTO',
    descricao: 'Quinolonas aumentam nível de Teofilina — risco de toxicidade.'
  },
  {
    medicamentos: ['alprazolam', 'clonazepam', 'diazepam', 'zolpidem', 'morfina', 'codeina', 'tramadol'],
    risco: 'ALTO',
    descricao: 'Benzodiazepínico + opioide aumenta risco de depressão respiratória grave.'
  },
  {
    medicamentos: ['alprazolam', 'clonazepam', 'diazepam', 'zolpidem', 'alcohol', 'alcool'],
    risco: 'ALTO',
    descricao: 'Benzodiazepínico + álcool potencializa sedação — risco de queda e acidente.'
  },
  {
    medicamentos: ['metronidazol', 'tinidazol', 'alcool', 'alcohol'],
    risco: 'ALTO',
    descricao: 'Metronidazol + álcool causa reação grave: náusea, vômito, taquicardia.'
  },
  {
    medicamentos: ['sertralina', 'fluoxetina', 'paroxetina', 'tramadol', 'triptano', 'sumatriptano'],
    risco: 'ALTO',
    descricao: 'Combinação pode causar síndrome serotoninérgica — emergência médica.'
  },
  {
    medicamentos: ['fenitoina', 'carbamazepina', 'warfarina'],
    risco: 'ALTO',
    descricao: 'Anticonvulsivantes alteram metabolismo da Warfarina — monitorar coagulação.'
  },
  {
    medicamentos: ['potassio', 'cloreto de potassio', 'espironolactona', 'captopril', 'enalapril', 'losartana'],
    risco: 'ALTO',
    descricao: 'Combinação pode causar hipercalemia (excesso de potássio) — risco cardíaco.'
  },
];

function normalizarNome(nome) {
  return nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function verificarInteracoes(listaMeds) {
  var alertas = [];
  var nomesNorm = listaMeds.map(function(m) {
    return normalizarNome(m.nome || '');
  });

  INTERACOES.forEach(function(inter) {
    var encontrados = [];
    inter.medicamentos.forEach(function(medInter) {
      var medNorm = normalizarNome(medInter);
      nomesNorm.forEach(function(nomeUsuario, idx) {
        if (nomeUsuario.indexOf(medNorm) !== -1 || medNorm.indexOf(nomeUsuario.split(' ')[0]) !== -1) {
          if (encontrados.indexOf(medInter) === -1) {
            encontrados.push(medInter);
          }
        }
      });
    });
    if (encontrados.length >= 2) {
      alertas.push({
        risco: inter.risco,
        descricao: inter.descricao,
        medicamentos: encontrados
      });
    }
  });

  // Remove duplicatas
  var unicos = [];
  alertas.forEach(function(a) {
    var existe = unicos.some(function(u) { return u.descricao === a.descricao; });
    if (!existe) unicos.push(a);
  });

  return unicos;
}
