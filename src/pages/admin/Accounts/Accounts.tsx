import { Box, TableCell, TableHead, Table, TableContainer, Typography, useTheme, TableRow, Paper, TableBody, TableFooter, TablePagination, TextField, Button } from "@mui/material";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/axiosInstance";
import { useEffect, useState } from "react";

interface Account {
    id: string;
    userId?: string;
    companyName: string;
    location?: string;
    zipCode?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website: string;
    industry?: string;
    tenantId?: string;
  }



const AccountsPage = () => {
    const theme = useTheme();
    const { enqueue } = useSnackbar();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        loadAccounts();
    }, []); 
    const loadAccounts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/accounts/all", {
                params: {
                    search,
                    page: page + 1,
                    limit: rowsPerPage,
                },
            });
            setAccounts(res.data.accounts as Account[]);
            setTotal(res.data.total);
        } catch (error) {
            enqueue("Failed to load accounts", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };



    return (
        <Box p={3}>
            <Typography variant="h5" fontWeight="bold">
                Accounts
            </Typography>
            {/* <TextField
                label="Search"
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                fullWidth
                margin="normal"
            /> */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Website</TableCell>
                            <TableCell>Industry</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>City</TableCell>
                            <TableCell>State</TableCell>
                            <TableCell>Zip Code</TableCell>
                            <TableCell>Country</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {accounts.map((account) => (
                            <TableRow key={account.id} onClick={() => navigate(`/accounts/${account.id}`)} hover sx={{ cursor: "pointer" }}>
                                <TableCell>{account.companyName}</TableCell>
                                <TableCell>{account.website}</TableCell>
                                <TableCell>{account.industry}</TableCell>
                                <TableCell>{account.phone}</TableCell>
                                <TableCell>{account.address}</TableCell>
                                <TableCell>{account.city}</TableCell>
                                <TableCell>{account.state}</TableCell>
                                <TableCell>{account.zipCode}</TableCell>
                                <TableCell>{account.country}</TableCell>
                                <TableCell>{account.location}</TableCell>
                                <TableCell>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/accounts/${account.id}`);
                                        }}
                                    >
                                        View
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/accounts/contacts/${account.id}`);
                                        }}
                                    >
                                        Contacts
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                count={total}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                component="td"
                                onPageChange={(_, p) => setPage(p)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(+e.target.value);
                                    setPage(0);
                                }}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AccountsPage;