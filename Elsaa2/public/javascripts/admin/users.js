function ResetAddForm() {
    $('#add-user div.modal-body form div div input#input-user-name').val('');
    $('#add-user div.modal-body form div div textarea#input-user-description').val('');
    $('#add-user div.modal-body form div div input#input-user-deletable').prop('checked', false);
}

function ResetEditForm() {
    $('#edit-user div.modal-body form div div input#input-user-id').val('');
    $('#edit-user div.modal-body form div div input#input-user-name').val('');
    $('#edit-user div.modal-body form div div textarea#input-user-description').val('');
    $('#edit-user div.modal-body form div div input#input-user-deletable').prop('checked', false);
}

function ResetDeleteForm() {
    $('#del-user div.modal-body form div div input#input-user-id').val('');
    $('#del-user div.modal-body form div div input#input-user-name').val('');
    $('#del-user div.modal-body form div div textarea#input-user-description').val('');
    $('#del-user div.modal-body form div div input#input-user-deletable').prop('checked', false);
}

function AddUser(parent, name, description, deletable, callback) {
    AsyncRPC('/admin/users/add', {
        parent: parent,
        name: name,
        description: description,
        deletable: deletable
    }, callback);
}

function EditUser(id, description, callback) {
    AsyncRPC('/admin/users/edit', {
        id: id,
        description: description
    }, callback);
}

function DeleteUser(id, callback) {
    AsyncRPC('/admin/users/delete', {
        id: id
    }, callback);
}

function ProcessUser(userList) {
    __elsaa_user_userList = userList;
    $('#userListBody').empty();
    $.each(userList, function (index, item) {
        var deletable = __elsaa_user_perms["Delete User"];
        var canModify = __elsaa_user_perms["Modify User"];
        var buttonGroup = '<div class="btn-group btn-group-xs"><button class="btn btn-default modify-button" ' + (canModify ? '' : 'disabled') + ' data-user-id="' + item.ID + '" data-toggle="modify" data-target="#edit-user">Modify</button><button class="btn btn-default delete-button" ' + (deletable ? '' : 'disabled') + ' data-user-id="' + item.ID + '" data-toggle="modify" data-target="#del-user">Delete</button></div>';
        var tr = $('<tr>').append(
            '<td><input type="checkbox" data-user-id="' + item.ID + '"></td><td>' + item.USERNAME + '</td><td>' + item.FULLNAME + '</td><td>' + item.EMAIL + '</td><td>' + item.TYPE + '</td><td>' + item.ACTIVE + '</td><td>' + buttonGroup + '</td>'
        );
        tr.appendTo($('#userListBody'));
    });
    BindModifyButtons(true);
    BindDeleteButtons(true);
}

$('#add-user div.modal-footer button#add-user-close-btn').click(function (e) {
    ResetAddForm();
});
$('#add-user div.modal-footer button#add-user-ok-btn').click(function (e) {
    var parent = $('#add-user div.modal-body form div div select#input-user-parent').select2('val');
    var name = $('#add-user div.modal-body form div div input#input-user-name').val();
    var description = $('#add-user div.modal-body form div div textarea#input-user-description').val();
    var deletable = $('#add-user div.modal-body form div div input#input-user-deletable').is(':checked');
    AddUser(parent, name, description, deletable, function (result) {
        if (result == true) {
            AsyncRPC('/admin/users/all', {}, function (result) {
                ProcessUser(result);
            });
        }
    });
    ResetAddForm();
});

$('#edit-user div.modal-footer button#edit-user-close-btn').click(function (e) {
    ResetEditForm();
});
$('#edit-user div.modal-footer button#edit-user-ok-btn').click(function (e) {
    var id = $('#edit-user div.modal-body form div div input#input-user-id').val();
    var description = $('#edit-user div.modal-body form div div textarea#input-user-description').val();
    EditUser(id, description, function (result) {
        if (result == true) {
            AsyncRPC('/admin/users/all', {}, function (result) {
                ProcessUser(result);
            });
        }
    });
    ResetEditForm();
});

$('#del-user div.modal-footer button#del-user-close-btn').click(function (e) {
    ResetDeleteForm();
});
$('#del-user div.modal-footer button#del-user-ok-btn').click(function (e) {
    var id = $('#del-user div.modal-body form div div input#input-user-id').val();
    DeleteUser(id, function (result) {
        if (result == true) {
            AsyncRPC('/admin/users/all', {}, function (result) {
                ProcessUser(result);
            });
        }
    });
    ResetDeleteForm();
});

function BindModifyButtons(rebind) {
    $('.modify-button').unbind('click').bind({
        'click': function (e) {
            var btn = e.currentTarget;
            if (rebind) {
                $($(btn).data('target')).modal('show');
            }
            var user = $.grep(__elsaa_user_userList, function (item, index) {
                return item.ID == $(btn).data('userId');
            })[0];
            $('#edit-user div.modal-body form div div input#input-user-id').val(user.ID);
            $('#edit-user div.modal-body form div div input#input-user-name').val(user.NAME);
            $('#edit-user div.modal-body form div div textarea#input-user-description').val(user.DESCRIPTION);
            $('#edit-user div.modal-body form div div input#input-user-deletable').prop('checked', user.DELETABLE == 1);
        }
    });
}

function BindDeleteButtons(rebind) {
    $('.delete-button').unbind('click').bind({
        'click': function (e) {
            var btn = e.currentTarget;
            if (rebind) {
                $($(btn).data('target')).modal('show');
            }
            var user = $.grep(__elsaa_user_userList, function (item, index) {
                return item.ID == $(btn).data('userId');
            })[0];
            $('#del-user div.modal-body form div div input#input-user-id').val(user.ID);
            $('#del-user div.modal-body form div div input#input-user-name').val(user.NAME);
            $('#del-user div.modal-body form div div textarea#input-user-description').val(user.DESCRIPTION);
            $('#del-user div.modal-body form div div input#input-user-deletable').prop('checked', user.DELETABLE == 1);
        }
    });
}

BindModifyButtons();
BindDeleteButtons();

AsyncRPC('/admin/users/all', {}, function (result) {
    ProcessUser(result);
});
