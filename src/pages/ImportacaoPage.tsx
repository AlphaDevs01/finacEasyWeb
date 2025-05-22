import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVData {
  descricao: string;
  valor: string;
  data: string;
  categoria: string;
}

const ImportacaoPage: React.FC = () => {
  const [csvData, setCSVData] = useState<CSVData[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Corrige nomes de colunas e valores vindos do Excel/LibreOffice
          const rawData = results.data as any[];
          // Mapeia possíveis nomes de colunas para os nomes esperados
          const normalizeHeader = (header: string) => {
            const h = header.trim().toLowerCase();
            if (h === 'descrição' || h === 'descrição*' || h === 'descricao') return 'descricao';
            if (h === 'valor') return 'valor';
            if (h === 'data') return 'data';
            if (h === 'categoria') return 'categoria';
            return h;
          };

          // Corrige os nomes das colunas do primeiro objeto
          const firstRow = rawData[0] || {};
          const mappedKeys = Object.keys(firstRow).reduce((acc, key) => {
            acc[key] = normalizeHeader(key);
            return acc;
          }, {} as Record<string, string>);

          // Monta os dados normalizados
          const data: CSVData[] = rawData.map((row) => ({
            descricao: row[Object.keys(row).find(k => mappedKeys[k] === 'descricao') || ''] || '',
            valor: row[Object.keys(row).find(k => mappedKeys[k] === 'valor') || ''] || '',
            data: row[Object.keys(row).find(k => mappedKeys[k] === 'data') || ''] || '',
            categoria: row[Object.keys(row).find(k => mappedKeys[k] === 'categoria') || ''] || '',
          }));

          // Validação: todos os campos obrigatórios
          const requiredFields = ['descricao', 'valor', 'data', 'categoria'];
          const hasAllFields = requiredFields.every(field =>
            Object.values(data[0] || {}).map(h => h.toLowerCase()).includes((data[0] as any)[field]?.toLowerCase())
          );
          if (!data[0] || !data[0].descricao || !data[0].valor || !data[0].data || !data[0].categoria) {
            setError('O arquivo CSV deve conter as colunas: descricao, valor, data, categoria');
            setCSVData([]);
            return;
          }
          setCSVData(data);
          setError('');
        },
        error: () => {
          setError('Erro ao ler o arquivo CSV');
          setCSVData([]);
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Validação extra antes de enviar
      if (!csvData.length) {
        setError('Nenhum dado para importar');
        setLoading(false);
        return;
      }
      for (const row of csvData) {
        if (!row.descricao || !row.valor || !row.data || !row.categoria) {
          setError('Todos os campos (descricao, valor, data, categoria) são obrigatórios em cada linha.');
          setLoading(false);
          return;
        }
      }
      // Envia para o backend
      const response = await api.post('/import/despesas', { data: csvData });
      setSuccess(`Importação concluída! ${response.data.registros_importados.length} registros importados.`);
      setCSVData([]);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao importar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Importação de Despesas</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Arraste e solte seu arquivo CSV aqui, ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 mt-1">
          O arquivo deve conter as colunas: descricao, valor, data, categoria
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
          <FileCheck size={20} />
          {success}
        </div>
      )}

      {csvData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Pré-visualização dos Dados</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(row.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.categoria}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvData.length > 5 && (
            <p className="text-sm text-gray-500 mt-2">
              Mostrando 5 de {csvData.length} registros
            </p>
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleImport}
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Importando...' : 'Importar Dados'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportacaoPage;