function ResetAddForm() {
    $('#add-permission div.modal-body form div div input#input-permission-name').val('');
    $('#add-permission div.modal-body form div div textarea#input-permission-description').val('');
    $('#add-permission div.modal-body form div div input#input-permission-deletable').prop('checked', false);
}

function ResetEditForm() {
    $('#edit-permission div.modal-body form div div input#input-permission-id').val('');
    $('#edit-permission div.modal-body form div div input#input-permission-name').val('');
    $('#edit-permission div.modal-body form div div textarea#input-permission-description').val('');
    $('#edit-permission div.modal-body form div div input#input-permission-deletable').prop('checked', false);
}

function ResetDeleteForm() {
    $('#del-permission div.modal-body form div div input#input-permission-id').val('');
    $('#del-permission div.modal-body form div div input#input-permission-name').val('');
    $('#del-permission div.modal-body form div div textarea#input-permission-description').val('');
    $('#del-permission div.modal-body form div div input#input-permission-deletable').prop('checked', false);
}

function AddPermission(parent, name, description, deletable, callback) {
    AsyncRPC('/admin/permissions/add', {
        parent: parent,
        name: name,
        description: description,
        deletable: deletable
    }, callback);
}

function EditPermission(id, description, callback) {
    AsyncRPC('/admin/permissions/edit', {
        id: id,
        description: description
    }, callback);
}

function DeletePermission(id, callback) {
    AsyncRPC('/admin/permissions/delete', {
        id: id
    }, callback);
}

function ProcessPermission(permissionList) {
    __elsaa_user_permissionList = permissionList;
    $('#permissionListBody').empty();
    $.each(permissionList, function (index, item) {
        var deletable = __elsaa_user_perms["Delete Permission"] ? (item.DELETABLE == 1 ? false : true) : true;
        var canModify = __elsaa_user_perms["Modify Permission"];
        var buttonGroup = '<div class="btn-group btn-group-xs"><button class="btn btn-default modify-button" ' + (canModify ? '' : 'disabled') + ' data-permission-id="' + item.ID + '" data-toggle="modify" data-target="#edit-permission">Modify</button><button class="btn btn-default delete-button" ' + (deletable ? 'disabled' : '') + ' data-permission-id="' + item.ID + '" data-toggle="modify" data-target="#del-permission">Delete</button></div>';
        var tr = $('<tr>').append(
            '<td><input type="checkbox" data-permission-id="' + item.ID + '"></td><td>' + item.NAME + '</td><td>' + item.DESCRIPTION + '</td><td>' + buttonGroup + '</td>'
        );
        tr.appendTo($('#permissionListBody'));
    });
    BindModifyButtons(true);
    BindDeleteButtons(true);
}

$('#add-permission div.modal-footer button#add-permission-close-btn').click(function (e) {
    ResetAddForm();
});
$('#add-permission div.modal-footer button#add-permission-ok-btn').click(function (e) {
    var parent = $('#add-permission div.modal-body form div div select#input-permission-parent').select2('val');
    var name = $('#add-permission div.modal-body form div div input#input-permission-name').val();
    var description = $('#add-permission div.modal-body form div div textarea#input-permission-description').val();
    var deletable = $('#add-permission div.modal-body form div div input#input-permission-deletable').is(':checked');
    AddPermission(parent, name, description, deletable, function (result) {
        if (result == true) {
            AsyncRPC('/admin/permissions/all', {}, function (result) {
                ProcessPermission(result);
            });
        }
    });
    ResetAddForm();
});

$('#edit-permission div.modal-footer button#edit-permission-close-btn').click(function (e) {
    ResetEditForm();
});
$('#edit-permission div.modal-footer button#edit-permission-ok-btn').click(function (e) {
    var id = $('#edit-permission div.modal-body form div div input#input-permission-id').val();
    var description = $('#edit-permission div.modal-body form div div textarea#input-permission-description').val();
    EditPermission(id, description, function (result) {
        if (result == true) {
            AsyncRPC('/admin/permissions/all', {}, function (result) {
                ProcessPermission(result);
            });
        }
    });
    ResetEditForm();
});

$('#del-permission div.modal-footer button#del-permission-close-btn').click(function (e) {
    ResetDeleteForm();
});
$('#del-permission div.modal-footer button#del-permission-ok-btn').click(function (e) {
    var id = $('#del-permission div.modal-body form div div input#input-permission-id').val();
    DeletePermission(id, function (result) {
        if (result == true) {
            AsyncRPC('/admin/permissions/all', {}, function (result) {
                ProcessPermission(result);
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
            var permission = $.grep(__elsaa_user_permissionList, function (item, index) {
                return item.ID == $(btn).data('permissionId');
            })[0];
            $('#edit-permission div.modal-body form div div input#input-permission-id').val(permission.ID);
            $('#edit-permission div.modal-body form div div input#input-permission-name').val(permission.NAME);
            $('#edit-permission div.modal-body form div div textarea#input-permission-description').val(permission.DESCRIPTION);
            $('#edit-permission div.modal-body form div div input#input-permission-deletable').prop('checked', permission.DELETABLE == 1);
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
            var permission = $.grep(__elsaa_user_permissionList, function (item, index) {
                return item.ID == $(btn).data('permissionId');
            })[0];
            $('#del-permission div.modal-body form div div input#input-permission-id').val(permission.ID);
            $('#del-permission div.modal-body form div div input#input-permission-name').val(permission.NAME);
            $('#del-permission div.modal-body form div div textarea#input-permission-description').val(permission.DESCRIPTION);
            $('#del-permission div.modal-body form div div input#input-permission-deletable').prop('checked', permission.DELETABLE == 1);
        }
    });
}

BindModifyButtons();
BindDeleteButtons();
